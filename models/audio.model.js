const mongoose = require('mongoose');
const { Schema } = mongoose;

const audioSchema = new Schema({
  friendlyName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['birthday', 'house-warming', 'wedding', 'naming', 'others'],
    required: true,
  },
  assetLink: {
    type: String,
  },
  uploadDate: {
    type: Date,
    default:Date.now(),
  },
});

const audio = mongoose.model('audios', audioSchema);
module.exports = audio;
