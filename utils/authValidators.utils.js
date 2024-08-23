const { rateLimit } = require('express-rate-limit');

const limitTrials = (maxRequests) => {
	const windowMs = 1 * 60 * 60 * 1000;
	return rateLimit({
		windowMs,
		limit: maxRequests,
		message: `you have reached the limit for your request please try again in ${
			windowMs / (60 * 60 * 1000)
		} hour(s).`,
		standardHeaders: true,
		legacyHeaders: false,
	});
};

const validateEmail = (email) => {
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
	return emailRegex.test(email);
};

const isAdmin = async (req, res, next) => {
	const user = req.user;
	if (!user || user.role !== 'admin') {
		return res.status(403).json({
			succes: false,
			message: 'Seems you are not authorized for this action.',
		});
	}
	next();
};

module.exports = {
	validateEmail,
	isAdmin,
	limitTrials,
};
