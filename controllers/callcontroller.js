const Call = require("../models/call.model");
const User = require("../models/users.model");
const twilio = require("twilio");
const passport = require("passport");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const {AccessToken} = require("twilio").jwt;
const VoiceGrant = AccessToken.VoiceGrant;
const VoiceResponse = twilio.twiml.VoiceResponse;
const callerId = "elder_call";

const defaultIdentity = "elder_call";

const callAccessToken = (user) => {
  const accessToken = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.API_KEY,
    process.env.API_KEY_SECRET
  );
  accessToken.identity = user.fullname;

  const voiceGrant = new AccessToken.VoiceGrant({
    outgoingApplicationSid:'to b added',
    
  });
  accessToken.addGrant(voiceGrant);
  return accessToken.toJwt();
}

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
  if (!user)
  {
    console.error("User object is not available, you must be logged in to use this feature");
    return res.status(500).send("User data is missing or incomplete, please try again");
  }

  if (!user.phone)
  {
    console.error("User phone number is not available:", user.phone);
    return res.status(500).send("User phone number is missing");
  }

  // Retrieve request body parameters
  const { calleeNumber, calleeName, calldirection, audioCategory } = req.body;

  try
  {
    
    if (!calleeNumber)
    {
      console.error("Recipient number is required but not provided");
      return res.status(400).json({
        msg: "Recipient number is required", data: {
          call_direction: "outbound",
          success: false,
          error: true,
          error_msg: "Recipient number is required",
      }});
    }

    // console.log("Callee number:", calleeNumber); 

    const twimlResponse = generateCallTwiML(calleeNumber, user);
    // console.log("Generated TwiML Response:", twimlResponse); 

    // Initiate the call
    const call = await client.calls.create({
      twiml: twimlResponse,
      to: calleeNumber,
      from: process.env.PHONE_NUMBER, 
      statusCallback: "https://drab-zebu-6611.twil.io/status", //statusCallback url to be updated later
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    // console.log("Call object:", call);

    // Determine call direction
    const callDirection = call.direction === "outbound-api" ? "outbound" : "inbound";

    // Create a call record
    const callRecord = new Call({
      userId: user._id,
      callSid: call.sid,
      phoneNumber: calleeNumber,
      calldirection: calldirection || callDirection,
      callDuration: call.duration || 0,
      callDate: new Date().toDateString(),
    });

    await callRecord.save();

    res.status(200).json({
      message: "Call initiated successfully",
      callRecord: callRecord,
    });
  } catch (err)
  {
    console.error("Error making the call:", err);
    res.status(500).send("Failed to make the call");
  }
};



const generateCallTwiML = (calleeNumber, user) => {
  // console.log("User phone number in generateCallTwiML:", user.phone);
  const twiml = new VoiceResponse();
  twiml.play("https://drab-zebu-6611.twil.io/assets/TunePocket-Touch-Of-Life-Logo-Preview.mp3");
  twiml.say("A moment please while we connect you to the caller");

  if (user.phone)
  {
    twiml.dial(user.phone); 
  } else
  {
    console.error("User phone number is missing when generating TwiML");
  }

  return twiml.toString();
};



const getCurrentCallSid = async () => {
  const user = req.user._id;
  try {
    const calls = await client.calls.list({ status: "in-progress" });
    return calls && calls.length > 0 ? calls[0].sid : null;
  } catch (error) {
    console.error("Failed to fetch current call SID:", error);
    throw new Error("Failed to fetch current call SID");
  }
};

const endCall = async (req, res) => {
  const user = req.user;
  try {
    const callSid = await getCurrentCallSid(req, res);

    if (!callSid) {
      res.status(404).send("No ongoing calls found");
      return;
    }
    const currentUserCall = await Call.findOne({
      userId: user._id,
      callSid: callSid,
    });
    if (currentUserCall) {
      await client.calls(callSid).update({ status: "completed" });
      return res.status(200).json({ message: "Call ended successfully" });
    } else {
      return res.status(404).send("No ongoing calls found for this user");
    }
  } catch (error) {
    console.error("Failed to end the call:", error);
    res.status(500).json({ msg: "Failed to end call", error });
  }
};

const webhook = async (req, res) => {
  try {
    const status = req.body.CallStatus;
    const callSid = req.body.CallSid;

    console.log(`Call status update: ${status}, Call SID: ${callSid}`);

    if (status === "completed") {
      client
        .calls(callSid)
        .fetch()
        .then((call) => {
          const audioUrl = call.url;
          console.log(`Audio file URL: ${audioUrl}`);
        })
        .catch((error) => {
          console.error("Failed to fetch call details:", error);
        });
    }

    res.status(200).end();
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};
const getTwilioCallLogs = async (req, res) => {
  try {
    const calls = await client.calls.list({ limit: 20 }); 
    res.status(200).json({ calls });
  } catch (error) {
    console.error("Failed to fetch call logs:", error);
    res.status(500).json({ error: "Failed to fetch call logs" });
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
    console.error("Failed to fetch call logs:", err);
    res.status(500).json({ error: "Failed to fetch call logs" });
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
      calldirection: (calldirection = "outbound"),
    });
    console.log(callsData);
    res.status(200).json({ data: callsData });
  } catch (error) {
    console.error("Failed to fetch call logs:", error);
    res.status(500).json({ error: "Failed to fetch call logs" });
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
