const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env._EMAIL,
    pass: process.env._EMAIL_APP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error verifying connection:", error);
  } else {
    console.log("Ready for sending messages:", success);
  }
});

const sendMail = async (mailInfo) => {
  try {
    // Send mail with defined transport object
    await transporter.sendMail(mailInfo);
    console.log("Email sent successfully.");
    return;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendMail,
};
