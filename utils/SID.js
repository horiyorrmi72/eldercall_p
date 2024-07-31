// SID.js
const twilio = require('twilio');

const getCurrentCallSid = async (client) => {
	try {
		const call = await client.calls.list({ status: 'in-progress' });
		if (call && call.length > 0) {
			console.log(`current call SID : ${call[0].sid}`);
			return call[0].sid;
		} else {
			return null;
		}
	} catch (error) {
		console.error('Failed to fetch current call SID:', error);
		throw new Error('Failed to fetch current call SID');
	}
};

module.exports = {
	getCurrentCallSid,
};
