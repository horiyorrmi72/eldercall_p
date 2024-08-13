const mongoose = require('mongoose');
const { Schema } = mongoose;

const OTPSchema = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
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
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 24 * 60 * 60 * 1000),
  },
});

const OTP = mongoose.model('OTP', OTPSchema);
module.exports = OTP;
