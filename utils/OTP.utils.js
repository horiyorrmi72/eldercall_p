const fs = require('fs').promises;
const path = require('path');
const User = require('../models/users.model');
const OTP = require('../models/otp.model');
const { sendMail } = require('../utils/sendMail.utils');
const { hashData, compareData } = require('./hashingdata.utils');

const generateOTP = () => {
	const min = 100000;
	const max = 999999;
	return String(Math.floor(min + Math.random() * (max - min + 1)));
};

const sendOTP = async (res, email) => {
	try {
		if (!email) {
			return res.status(400).json({ error: 'Provide a valid user email' });
		}

		const existingUser = await User.findOne({ email });

		if (!existingUser) {
			return res.status(404).json({ error: 'User not found' });
		}

		const generatedOTP = generateOTP();

		await OTP.deleteMany({ email });

		// Read the HTML template file from views/template directory
		const templatePath = path.join(__dirname, '../views/templates/otp.html');
		const htmlTemplate = await fs.readFile(templatePath, 'utf8');

		const mailInfo = {
			from: process.env._EMAIL,
			to: email,
			subject: 'Your One-Time Password (OTP) from the callAPP',
			html: htmlTemplate
				.replace('{{username}}', existingUser.fullname)
				.replace('{{otp}}', generatedOTP),
		};

		await sendMail(mailInfo);

		const hashedOTP = await hashData(generatedOTP);

		const newOTP = new OTP({
			email,
			otp: hashedOTP,
			createdAt: Date.now(),
			expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours validity
		});

		await newOTP.save();

		return { token: email };
	} catch (error) {
		console.error(error);
		res.send({ status: 500, message: error.message });
	}
};

const verifyOtp = async (token, otp) => {
	try {
		if (!(otp && token)) {
			return { error: 'Values cannot be empty' };
		}

		const existingOtp = await OTP.findOne({ email: token });

		if (!existingOtp) {
			return { error: 'OTP not found or not registered email' };
		}

		const { expiresAt } = existingOtp;

		if (expiresAt < Date.now()) {
			await OTP.deleteOne({ email: token });
			return { message: 'Code expired' };
		}

		const hashedOtp = existingOtp.otp;
		const verifiedOtp = await compareData(otp, hashedOtp);

		if (!verifiedOtp) {
			return { message: 'Invalid OTP' };
		}

		return { message: 'Success', verifiedOtp };
	} catch (error) {
		console.error(error.message);
	}
};

const deleteOtp = async (token) => {
	try {
		await OTP.deleteOne({ email: token });
		return 'Successfully deleted';
	} catch (error) {
		console.log(error);
	}
};

module.exports = {
	generateOTP,
	sendOTP,
	verifyOtp,
	deleteOtp,
};
