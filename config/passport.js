require('dotenv').config();
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/users.model');

module.exports = (passport) => {
	const opts = {};
	opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
	opts.secretOrKey = process.env.JWT_SECRET;

	passport.use(
		new JwtStrategy(opts, async (jwt_payload, done) => {
			// console.log("JWT Payload:", jwt_payload);
			try {
				const user = await User.findOne({ _id: jwt_payload.userId });
				if (user) {
					// console.log("User found:", user);
					return done(null, user);
				} else {
					console.log('User not found');
					return done(null, false);
				}
			} catch (error) {
				console.error('Error in passport strategy:', error);
				return done(error, false);
			}
		})
	);

	passport.serializeUser((user, done) => {
		done(null, user._id);
	});

	passport.deserializeUser((id, done) => {
		User.findById(id, (err, user) => {
			done(err, user);
		});
	});
};
