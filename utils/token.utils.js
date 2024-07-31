const jwt = require('jsonwebtoken');

const generateToken = function generateAccessToken(payload) {
	const token = jwt.sign(payload, process.env.JWT_SECRET);
	return token;
};
const generateAccessToken = function generateAccessToken(payload) {
	const token = jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn: 68400,
	});
	return token;
};

const generateRefreshToken = function generateRefreshToken(payload) {
	const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: 86400,
	});
	return token;
};

const verifyRefreshToken = function verifyRefreshToken(token) {
	try {
		const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
		return { success: true, data: decoded };
	} catch (err) {
		return { success: false, message: err.message };
	}
};

// to be confirmed.
const generateResetToken = function generateResetToken(email) {
	const resetToken = jwt.sign(process.JWT_SECRET + email);
	return resetToken;
};

const verifyJWTToken = async (req, res) => {
	try {
		const token = req.headers.authorization || req.params || req.body;
		if (!token) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded.user;
	} catch (err) {
		console.log(err.message);
		return res.status(500).json({ message: 'Error verifying', err });
	}
};

module.exports = {
	generateToken,
	generateAccessToken,
	generateRefreshToken,
	verifyRefreshToken,
};
