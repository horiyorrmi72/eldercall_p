const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const Twilio = require('twilio');
const client = Twilio(accountSid, authToken);

const createService = async (req, res) => {
  try {
    const service = await client.serverless.v1.services.create({
      includeCredentials: true,
      uniqueName: 'el-der',
      friendlyName: 'el-der',
    });
    console.log({ service, theSid: service.sid });
    return res.status(200).send(service.sid);
  } catch (error) {
    console.error('Error creating Twilio service:', error);
    throw error;
    return res.status(500).send('Error creating service SID');
  }
};

module.exports = {
  createService,
};
