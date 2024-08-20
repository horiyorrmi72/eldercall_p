const Call = require('../models/call.model');
const User = require('../models/users.model');
const { getAudioLinkByCategory } = require('./audiocontroller');
const twilio = require('twilio');
const passport = require('passport');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const { AccessToken } = require('twilio').jwt;
const VoiceResponse = twilio.twiml.VoiceResponse;
const callerId = 'elder_call';

const defaultIdentity = callerId;

const callAccessToken = (user) => {
	const accessToken = new AccessToken(
		process.env.TWILIO_ACCOUNT_SID,
		process.env.API_KEY,
		process.env.API_KEY_SECRET
	);
	accessToken.identity = defaultIdentity;

	const voiceGrant = new AccessToken.VoiceGrant({
		outgoingApplicationSid: 'to b added',
	});
	accessToken.addGrant(voiceGrant);
	return accessToken.toJwt();
};

/**
 * Initiates a Twilio voice call from the given phone number to the provided callee number.
 *
 * @param {Object} req - Express request object
 * @param {string} req.body.calleeNumber - Phone number to call
 * @param {string} req.body.calleeName - Name of call recipient
 * @param {string} const user = req.user._id;req.body.callDirection - Direction of call (inbound/outbound)
 * @param {Object} res - Express response object
 *
 * @returns {Promise} - Promise resolving to call record object or error response
 */

const makeCall = async (req, res) => {
	const user = req.user;
	// console.log("Authenticated user:", user);
	if (!user) {
		// console.error('User object is not available, you must be logged in to use this feature');
		return res
			.status(500)
			.send('User data is missing or incomplete, please try again');
	}

	if (!user.phone) {
		// console.error('User phone number is not available:', user.phone);
		return res.status(500).send('User phone number is missing');
	}

	// Retrieve request body parameters
	const { calleeNumber, calleeName, calldirection, audioCategory } = req.body;

	try {
		if (!calleeNumber) {
			// console.error('Recipient number is required but not provided');
			return res.status(400).json({
				msg: 'Recipient number is required',
				data: {
					call_direction: 'outbound',
					success: false,
					error: true,
					error_msg: 'Recipient number is required',
				},
			});
		}

		if (!audioCategory) {
			return res.status(400).json({
				msg: 'you need to specify a category',
				data: {
					call_direction: 'outbound',
					success: false,
					error: true,
					error_msg: 'category is required',
				},
			});
		}
		// console.log("Callee number:", calleeNumber);

		const twimlResponse = generateCallTwiML(calleeNumber, audioCategory, user);
		// console.log("Generated TwiML Response:", twimlResponse);

		// Initiate the call
		const call = await client.calls.create({
			twiml: twimlResponse,
			to: calleeNumber,
			from: process.env.PHONE_NUMBER,
			statusCallback: 'https://drab-zebu-6611.twil.io/status', //statusCallback url to be updated later
			statusCallbackMethod: 'POST',
			statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
		});

		// console.log("Call object:", call);

		// Determine call direction
		const callDirection =
			call.direction === 'outbound-api' ? 'outbound' : 'inbound';

		// Create a call record
		const callRecord = new Call({
			userId: user._id,
			callSid: call.sid,
			phoneNumber: calleeNumber,
			calldirection: calldirection || callDirection,
			callDuration: call.duration || 0,
			callStatus: call.status,
      callDate: new Date().toDateString(),
      
		});

		await callRecord.save();

		res.status(200).json({
			message: 'Call initiated successfully',
			callRecord: callRecord,
		});
	} catch (err) {
		// console.error('Error making the call:', err);
		res.status(500).send('Failed to make the call');
	}
};

const generateCallTwiML = async (calleeNumber, audioCategory, user) => {
	const twiml = new VoiceResponse();
	const audioToPlay = await getAudioLinkByCategory(audioCategory);
	twiml.play(`${audioToPlay}`);
	twiml.say('A moment please while we connect you to the caller');

	if (user.phone) {
		twiml.dial(user.phone);
	} else {
		console.error('User phone number is missing when generating TwiML');
	}

	return twiml.toString();
};

const getCurrentCallSid = async () => {
	try {
		const calls = await client.calls.list({
			status: ['queued', 'in-progress', 'ringing'],
		});

		// console.log('Retrieved calls:', calls);

		// Return an array of call SIDs
		return calls.map((call) => call.sid);
	} catch (error) {
		// console.error('Failed to fetch current call SIDs:', error);
		throw new Error('Failed to fetch current call SIDs');
	}
};

const endCall = async (req, res) => {
	const user = req.user;

	if (!user) {
		return res.status(401).json({ message: 'User not authenticated' });
	}

	try {
		// Fetch ongoing call SIDs
		const callSids = await getCurrentCallSid();

		if (!callSids || callSids.length === 0) {
			return res.status(404).json({ message: 'No ongoing calls found' });
		}

		// Query for ongoing calls associated with the user
		const currentUserCall = await Call.findOne({
			userId: user._id,
			callSid: { $in: callSids },
			callStatus: ['in-progress', 'queued', 'ringing'],
		});

		if (currentUserCall) {
			// End the call
			await client
				.calls(currentUserCall.callSid)
				.update({ status: 'completed' });
			return res.status(200).json({ message: 'Call ended successfully' });
		} else {
			return res
				.status(404)
				.json({ message: 'No ongoing calls found for this user' });
		}
	} catch (error) {
		// console.error('Failed to end the call:', error);
		return res.status(500).json({ message: 'Failed to end call', error });
	}
};

const webhook = async (req, res) => {
	try {
		const status = req.body.CallStatus;
		const callSid = req.body.CallSid;

		console.log(`Call status update: ${status}, Call SID: ${callSid}`);

		if (status === 'completed') {
			client
				.calls(callSid)
				.fetch()
				.then((call) => {
					const audioUrl = call.url;
					console.log(`Audio file URL: ${audioUrl}`);
				})
				.catch((error) => {
					console.error('Failed to fetch call details:', error);
				});
		}

		res.status(200).end();
	} catch (error) {
		// console.error('Error handling webhook:', error);
		res.status(500).send('Internal Server Error');
	}
};
const getTwilioCallLogs = async (req, res) => {
	try {
		const calls = await client.calls.list({ limit: 20 });
		res.status(200).json({ calls });
	} catch (error) {
		// console.error('Failed to fetch call logs:', error);
		res.status(500).json({ error: 'Failed to fetch call logs' });
	}
};

/**
 * get all custom call logs from db
 * return ok status (200) if sucessful with call logs
 * return error if there is error and console.log error.
 
*/
const getCustomCallLogs = async (req, res) => {
	try {
		const callLogs = await Call.find();
		res.status(200).json({ callLogs });
	} catch (err) {
		// console.error('Failed to fetch call logs:', err);
		res.status(500).json({ error: 'Failed to fetch call logs' });
	}
};

/**
 *
 * get user making call
 * fetch all outbound calls from database (custom data)
 * return ok status (200) if sucessful with call logs
 * return error if there is error and console.log error.
 */

const getCustomOutboundCallLogs = async (req, res) => {
	try {
		// const user = req.user._id;
		const callsData = await Call.find({
			calldirection: (calldirection = 'outbound'),
		});
		// console.log(callsData);
		res.status(200).json({ data: callsData });
	} catch (error) {
		// console.error('Failed to fetch call logs:', error);
		res.status(500).json({ error: 'Failed to fetch call logs' });
	}
};

module.exports = {
	makeCall,
	endCall,
	getCurrentCallSid,
	webhook,
	getTwilioCallLogs,
	getCustomOutboundCallLogs,
	getCustomCallLogs,
};
