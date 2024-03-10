const express = require("express");
const passport = require("passport");
const authcontroller = require("../controllers/authcontroller");
const usercontroller = require("../controllers/usercontroller");
const callcontroller = require("../controllers/callcontroller");
const OTP = require("../utils/OTP.utils");
const audiocontroller = require("../controllers/audiocontroller");
const sidcontroller = require("../utils/service.utils");

const router = express.Router();

// auth routes
router.post("/auth/signup", authcontroller.signup);
router.post("/auth/login", authcontroller.login);
router.post("/auth/forgot-password", authcontroller.forgotPassword);
router.post("/auth/reset-password", authcontroller.resetPassword);
router.post("/sendotp", OTP.sendOTP);
router.post("/verifyotp", OTP.verifyOtp);
router.post("/deleteotp", OTP.deleteOtp);

/*user routes*/
router.get("/userbyid/:id", usercontroller.getUserById);

/*call routes*/
router.post("/make-call", callcontroller.makeCall);
router.post("/end-call", callcontroller.endCall);
router.get("/status", callcontroller.webhook);
router.get("/twilioLogs", callcontroller.getTwilioCallLogs);
router.get("/outboundCallLogs", callcontroller.getCustomOutboundCallLogs);
router.get("/customlogs", callcontroller.getCustomCallLogs);


// audio routes
router.post("/upload", audiocontroller.uploadAsset);
router.get("/play-audio/:category", audiocontroller.getAudioLinkByCategory);

// sid creator
router.get("/getSid", sidcontroller.createService);

module.exports = router;
