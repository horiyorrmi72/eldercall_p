const mongoose = require('mongoose');
const { Schema } = mongoose;

const ResetTokenSchema = new Schema({
	userId: {
		type: mongoose.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	email: {
		type: String,
		unique: true,
		required: true,
	},
	token: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	expiresAt: {
		type: Date,
		default: Date.now,
		index: { expires: '1h' },
	},
});

// Middleware to automatically set the expiration time if not provided
ResetTokenSchema.pre('save', function (next) {
	if (!this.expiresAt) {
		this.expiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour from when the token generation took place
	}
	next();
});

const ResetToken = mongoose.model('ResetToken', ResetTokenSchema);
module.exports = ResetToken;
