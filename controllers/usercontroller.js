const User = require("../models/users.model");

//get number of users
const getUsersTotal = (req, res) => {
  User.countDocuments()
    .then((count) => {
      res.status(200).json({ count: count });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
};
//get user by ID's
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).exec();

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ user: user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

//admin feature
const isAdmin = (req, res, next) => {
  try {
    const userRole = req.user.role;

    if (userRole === "admin") {
      next();
    } else {
      return res.status(403).json({
        error: "Unauthorized - You need admin privileges to access this.",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUserById,
  getUsersTotal,
  isAdmin,
};
