const mongoose = require("mongoose");
const { Schema } = mongoose;

const OTPSchema = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  email: {
    type: String,
    unique: true,
  },
  otp: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Set default value to the current date/time
  },
  expiresAt: {
    type: Date,
    // Optionally set a default expiration period, e.g., 24 hours from creation
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000),
  },
});

const OTP = mongoose.model("OTP", OTPSchema); // Corrected model name 'OTP'
module.exports = OTP;
