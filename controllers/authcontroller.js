const User = require('../models/users.model');
// const ResetTokenObj = require('../models/resetToken.model');
const { hashData, compareData } = require('../utils/hashingdata.utils');
const {
	generateRefreshToken,
	generateAccessToken,
} = require('../utils/token.utils');
const {
	sendResetLink,
	verifyResetToken,
	deleteResetToken,
} = require('../utils/OTP.utils');
const { validateEmail } = require('../utils/authValidators.utils');
const path = require('path');

/**
 * Signs up a new user.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body with fullname, email, password, phone
 * @param {Object} res - Express response object
 * @returns {Object} res - Response with new user object and token
 */
const signup = async (req, res) => {
	const { fullname, email, password, confirmPassword, phone } = req.body;
	try {
		if (!fullname || !email || !password || !phone) {
			return res.status(400).json({ error: 'All input fields are required' });
		}

		if (!validateEmail(email)) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		if (password !== confirmPassword) {
			return res.status(400).json({ error: 'Passwords do not match' });
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res
				.status(400)
				.json({ error: 'User already registered with this email' });
		}

		const hashedPassword = await hashData(password);

		const user = new User({
			fullname,
			email,
			password: hashedPassword,
			phone,
		});
		await user.save();

		const token = generateAccessToken({ userId: user._id });

		return res
			.status(201)
			.json({ message: 'User created successfully', user, token });
	} catch (err) {
		return res
			.status(500)
			.json({ error: 'Internal server error', details: err.message });
	}
};

/**
 * Logs a user in by validating their email and password.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body with email and password
 * @param {Object} res - Express response object
 * @returns {Object} res - Response with auth tokens and user data
 */
const login = async (req, res) => {
	const { email, password } = req.body;
	try {
		if (!validateEmail(email)) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ error: 'User not found. Please sign up.' });
		}

		const matchPassword = await compareData(password, user.password);
		if (!matchPassword) {
			return res.status(401).json({ error: 'Incorrect password' });
		}

		const accessToken = generateAccessToken({ userId: user._id });
		const refreshToken = generateRefreshToken({ userId: user._id });

		return res.status(200).json({
			message: 'Login successful',
			accessToken: 'JWT ' + accessToken,
			refreshToken,
			user: { id: user._id, email: user.email, fullname: user.fullname },
		});
	} catch (err) {
		return res
			.status(500)
			.json({ error: 'Internal server error', details: err.message });
	}
};

/**
 * Handles forgot password flow by sending a reset link to the user's email.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body with email
 * @param {Object} res - Express response object
 * @returns {Object} res - Response with success message
 */
const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		if (!validateEmail(email)) {
			return res.status(400).json({ error: 'Invalid email format' });
		}

		await sendResetLink(req,res, email);
	} catch (error) {
		return res
			.status(500)
			.json({ error: 'Internal server error', details: error.message });
	}
};

/**
 * Resets the user's password with a new password.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body with email, token, and new password
 * @param {Object} res - Express response object
 * @returns {Object} res - Response with success message
 */
const resetPassword = async (req, res) => {
	const { email, token, newPassword } = req.body;
	try {
		if (!email || !token || !newPassword) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		const verification = await verifyResetToken(email, token);
		if (verification.error) {
			return res.status(400).json({ error: verification.error });
		}

		if (newPassword.length < 8) {
			return res
				.status(400)
				.json({ error: 'Password must be at least 8 characters long' });
		}

		const hashedPassword = await hashData(newPassword);
		await User.updateOne({ email }, { password: hashedPassword });
		await deleteResetToken(email);

		return res.status(200).json({ message: 'Password updated successfully' });
	} catch (error) {
		return res
			.status(500)
			.json({ error: 'Internal server error', details: error.message });
	}
};

const servePasswordResetPage = async (req, res) => {
	const { token, email } = req.query;
	if (!(token && email)) {
		return res.status(400).send('Invalid reset link');
	}
	res.sendFile(path.join(__dirname, '../views/templates/Password_reset.html'));
};

module.exports = {
	signup,
	login,
	forgotPassword,
	resetPassword,
	servePasswordResetPage,
};
