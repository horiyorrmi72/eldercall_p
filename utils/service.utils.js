const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const Twilio = require("twilio");
const client = Twilio(accountSid, authToken);

const createService = async (req, res) => {
  try {
    const service = await client.serverless.v1.services.create({
      includeCredentials: true,
      uniqueName: "el-der",
      friendlyName: "el-der",
    });
    console.log({ service, theSid: service.sid });
    return res.status(200).send( service.sid );
  } catch (error) {
    console.error("Error creating Twilio service:", error);
    throw error;
    return res.status(500).send("Error creating service SID")
  }
};

/*
{
  service: {
    sid: 'ZSa944085ddd48d3f4da230a47204f503b',
    accountSid: 'AC614d99d47fbe830a1470fd81a9979d58',
    friendlyName: 'el-der',
    uniqueName: 'el-der',
    includeCredentials: true,
    uiEditable: false,
    domainBase: 'el-der-6142',
    dateCreated: 2024-01-08T14:41:12.000Z,
    dateUpdated: 2024-01-08T14:41:12.000Z,
    url: 'https://serverless.twilio.com/v1/Services/ZSa944085ddd48d3f4da230a47204f503b',
    links: {
      functions: 'https://serverless.twilio.com/v1/Services/ZSa944085ddd48d3f4da230a47204f503b/Functions',
      assets: 'https://serverless.twilio.com/v1/Services/ZSa944085ddd48d3f4da230a47204f503b/Assets',
      environments: 'https://serverless.twilio.com/v1/Services/ZSa944085ddd48d3f4da230a47204f503b/Environments',
      builds: 'https://serverless.twilio.com/v1/Services/ZSa944085ddd48d3f4da230a47204f503b/Builds'
    }
  },
  theSid: 'ZSa944085ddd48d3f4da230a47204f503b'
}
*/ 

module.exports = {
  createService,
};
