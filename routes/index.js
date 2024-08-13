require('dotenv').config();
const express = require('express');
const passport = require('passport');
const authcontroller = require('../controllers/authcontroller');
const usercontroller = require('../controllers/usercontroller');
const callcontroller = require('../controllers/callcontroller');
const OTP = require('../utils/OTP.utils');
const audiocontroller = require('../controllers/audiocontroller');
const sidcontroller = require('../utils/service.utils');
const appcontroller = require('../controllers/appcontroller');
const multer = require('multer');
const { memoryStorage } = require('multer');

const storage = memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, //50MB
});

const router = express.Router();

router.get('/', appcontroller.ElderAppHome);
// Auth routes
router.post('/auth/signup', authcontroller.signup);
router.post('/auth/login', authcontroller.login);
router.post('/auth/forgot-password', authcontroller.forgotPassword);
router.post('/auth/reset-password', authcontroller.resetPassword);
router.post('/sendotp', OTP.sendOTP);
router.post('/verifyotp', OTP.verifyOtp);
router.post('/deleteotp', OTP.deleteOtp);

// User routes
router.get('/userbyid/:id', usercontroller.getUserById);

// Call routes
router.post(
  '/make-call',
  passport.authenticate('jwt', { session: false }),
  callcontroller.makeCall
);
router.post(
  '/end-call',
  passport.authenticate('jwt', { session: false }),
  callcontroller.endCall
);
router.get('/status', callcontroller.webhook);
router.get('/twilioLogs', callcontroller.getTwilioCallLogs);
router.get('/outboundCallLogs', callcontroller.getCustomOutboundCallLogs);
router.get('/customlogs', callcontroller.getCustomCallLogs);

// Audio routes
router.post('/upload', upload.single('audiofile'), audiocontroller.uploadAsset);
router.get('/play-audio/:category', audiocontroller.getAudioLinkByCategory);

// SID creator
router.get('/getSid', sidcontroller.createService);

module.exports = router;
