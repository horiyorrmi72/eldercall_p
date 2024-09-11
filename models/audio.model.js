const mongoose = require('mongoose');
const { Schema } = mongoose;

const audioSchema = new Schema({
	friendlyName: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		enum: [
			'birthday',
			'house-warming',
			'wedding',
			'naming',
			'love',
			'christmas',
			'new-year',
			'easter',
			'prayer',
			'sallah',
			'others',
		],
		required: true,
	},
	assetLink: {
		type: String,
	},
	shortVersionAssetLink: {
		type: String,
	},
	uploadDate: {
		type: Date,
		default: Date.now(),
	},
});

const audio = mongoose.model('audios', audioSchema);
module.exports = audio;
