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

const signup = async (req, res) => {
  const { fullname, email, password } = req.body;
  try {
    if (!fullname || !email || !password) {
      return res.status(400).json({ error: "all input required" });
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
      email,
      username,
      password: hashedPassword,
    });
    await user.save();
    const token = generateAccessToken({ userId: user._id });

    res
      .status(200)
      .json({ message: "User Created Successfully", user: user, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
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
      user: { id: user._id, email: user.email, username: user.fullname },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
// forgot password
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
    console.error(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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

    // Pass 'res' to deleteOtp function
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
