const fs = require('fs').promises;
const path = require('path');
const User = require('../models/users.model');
const ResetTokenObj = require('../models/resetToken.model');
const { sendMail } = require('../utils/sendMail.utils');
const crypto = require('crypto');

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const sendResetLink = async (req, res, email) => {
	try {
		if (!email) {
			return res.status(400).json({ error: 'Provide a valid user email' });
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const resetToken = generateResetToken();
		const hashedToken = crypto
			.createHash('sha256')
			.update(resetToken)
			.digest('hex');

		await ResetTokenObj.deleteMany({ email });

		const newResetToken = new ResetTokenObj({
			userId: user._id,
			email,
			token: hashedToken,
			expiresAt: Date.now() + 1 * 60 * 60 * 1000,
		});
		await newResetToken.save();

		// Read the HTML template file
		const templatePath = path.join(
			__dirname,
			'../views/templates/resetLink.html'
		);
		const htmlTemplate = await fs.readFile(templatePath, 'utf8');
		const resetLink = `${req.protocol}://${req.get(
			'host'
		)}/password-reset?token=${resetToken}&email=${email}`;

		const mailInfo = {
			from: process.env._EMAIL,
			to: email,
			subject: 'Password Reset Link from the elderApp',
			html: htmlTemplate
				.replace('{{username}}', user.fullname.split(' ')[0])
				.replace('{{resetLink}}', resetLink),
		};

		await sendMail(mailInfo);
		return res
			.status(200)
			.json({ message: 'Password reset link sent successfully', resetLink });
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
};

const verifyResetToken = async (email, token) => {
	try {
		if (!(email && token)) {
			return { error: 'Values cannot be empty' };
		}

		const existingToken = await ResetTokenObj.findOne({ email });

		if (!existingToken || existingToken.expiresAt < Date.now()) {
			return { error: 'Invalid or expired reset link' };
		}

		const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
		if (hashedToken !== existingToken.token) {
			return { error: 'Invalid reset token' };
		}

		return { message: 'Token verified', verified: true };
	} catch (error) {
		console.error(error.message);
		return { error: error.message };
	}
};

const deleteResetToken = async (email) => {
	try {
		await ResetTokenObj.deleteOne({ email });
		return 'Successfully deleted';
	} catch (error) {
		console.error(error);
		return 'Error deleting token';
	}
};

module.exports = {
	sendResetLink,
	verifyResetToken,
	deleteResetToken,
};
