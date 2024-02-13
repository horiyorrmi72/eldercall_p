const mongoose = require("mongoose");
const { Schema } = mongoose;

const callSchema = new Schema({
  // userId: {
  //   type: Schema.Types.ObjectId,
  //   ref: "User",
  // },
  calls: {
    callSid: {
      type: String,
      unique: true,
    },
    calleeName: {
      type: String,
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    calldirection: {
      type: String,
    },
    callDuration: {
      type: Number,
      default: 0,
    },
    callDate: {
      type: Date,
    },
  },
});

const call = mongoose.model("Calls", callSchema);
module.exports = call;
