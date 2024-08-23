const mongoose = require('mongoose');
const { Schema } = mongoose;

const callSchema = new Schema({
  callSid: {
    type: String,
    unique: true,
    required: true
  },
  calleeName: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  calldirection: {
    type: String,
  },
  callDuration: {
    type: Number,
    default: 0,
  },
  callStatus: {
    type: String,
    trim: true,
  },
  callDate: {
    type: Date,
    default:Date.now(),
  },
});

const call = mongoose.model('Calls', callSchema);
module.exports = call;
