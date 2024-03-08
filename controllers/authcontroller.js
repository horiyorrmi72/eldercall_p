const User = require("../models/users.model");
const OTP = require("../models/otp.model");
const { hashData, compareData } = require("../utils/hashingdata.utils");
const {
  generateRefreshToken,
  generateAccessToken,
} = require("../utils/token.utils");
const {
  generateOTP,
  sendOTP,
  verifyOtp,
  deleteOtp,
} = require("../utils/OTP.utils");
const { validateEmail } = require("../utils/authValidators.utils");

/**
 * Signs up a new user.
 *
 * This function takes a request body with fullname, email and password,
 * validates the input, checks for existing user with same email,
 * hashes the password, saves the new user to the database,
 * generates a JWT access token and
 * returns a response with the new user object and token.
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body with fullname, email and password
 * @param {string} req.body.fullname - Full name of user
 * @param {string} req.body.email - Email of user
 * @param {string} req.body.password - Password of user
 * @param {Object} res - Express response object
 * @returns {Object} res - Response with new user object and token
 */
const signup = async (req, res) => {
  const { fullname, email, password } = req.body;
  try {
    if (!fullname || !email || !password) {
      return res.status(400).json({ error: "all input required" });
    }
    // validate email.
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format!" });
    }

    // Check if the user is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        error: "already registered, user with email or username exist!",
      });
    }

    // Hash user password
    const hashedPassword = await hashData(password);

    // Create a new user account and save data to db
    const user = new User({
      fullname,
      email,
      password: hashedPassword,
    });
    await user.save();
    const token = generateAccessToken({ userId: user._id });

    res
      .status(200)
      .json({ message: "User Created Successfully", user: user, token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Logs a user in by validating their email and password.
 * Checks if user exists and password matches.
 * Generates JWT access and refresh tokens on success.
 *
 * @param {Object} req - Express request object
 * @param {string} req.body.email - User's email
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Object} res - Response with auth tokens and user data
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  try
  {
    if (!validateEmail(email))
    {
      return res.status(400).json({ error: "Invalid Email or Password!" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "user not found kindly signup" });
    }

    // Checking if password matches with the user's password on db
    const matchPassword = await compareData(password, user.password);

    if (!matchPassword) {
      return res.status(401).json({ error: "password mismatch" });
    }

    const accessToken = generateAccessToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });
    return res.status(200).json({
      message: "User authenticated",
      accessToken: "JWT " + accessToken,
      refreshToken: refreshToken,
      user: { id: user._id, email: user.email, fullname: user.fullname },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// forgot password
/**
 * Handles forgot password flow.
 * Sends OTP to user email if registered.
 * Saves hashed OTP in DB.
 * Returns 200 with email as token on success.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Not a registered user!" });
    }

    const resetOtp = generateOTP();
    const hashedOTP = await hashData(resetOtp);

    // Save OTP and email to the database
    user.resetPasswordOTP = hashedOTP;
    await user.save();

    // Send OTP to the user's email
    await sendOTP(res, email, resetOtp);

    // Return the response with the email (token) here
    return res.status(200).json({
      message: "OTP sent successfully for password reset",
      token: email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// =========updating password============
/**
 * Handles resetting user password with OTP.
 * Verifies OTP against user email.
 * Updates user password if OTP is valid.
 * Returns 200 if password reset is successful.
 */
const resetCode = async (req, res) => {
  try {
    const { token, otp } = req.body;

    const user = await User.findOne({ email: token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingOtp = await OTP.findOne({ email: token });

    if (!existingOtp) {
      return res
        .status(401)
        .json({ message: "OTP not found or not registered email" });
    }

    const { expiresAt } = existingOtp;

    if (expiresAt < Date.now()) {
      await OTP.deleteOne({ email: token });
      return res.status(401).json({ message: "Code expired" });
    }

    const hashedOtp = existingOtp.otp;
    const verifiedOtp = await compareData(otp, hashedOtp);

    if (!verifiedOtp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    return res
      .status(200)
      .json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Handles resetting user password with a new password.
 * Verifies user email and ensures new password meets length requirement.
 * Hashes new password and updates user document.
 * Calls deleteOtp() to invalidate OTP after password reset.
 * Returns 200 if password reset successful.
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({ email: token });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword.length < 8) {
      return res.status(403).json({ message: "Password too short" });
    }

    const hashNewPassword = await hashData(newPassword);
    await User.updateOne({ email: token }, { password: hashNewPassword });

    await deleteOtp(token);

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetCode,
  resetPassword,
};
