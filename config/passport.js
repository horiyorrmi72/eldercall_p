require("dotenv").config();
const { Strategy } = require("passport-jwt");
const user = require("../models/users.model");
const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;

module.exports = (passport) => {
  const opts = {};

  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = process.env.JWT_SECRET;

  passport.use(
    new Strategy(opts, async function (jwt_payload, done) {
      try {
        await user.findOne({ id: jwt_payload._id }, (err, user) => {
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        });
      } catch (error) {
        return done(err, false);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    user.getUserById(id, (err, user) => {
      done(err, user);
    });
  });
};
