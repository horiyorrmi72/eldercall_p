const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * User schema definition.
 * Defines the schema for User model with:
 * - fullname: Full name of user
 * - email: Email address of user
 * - password: Hashed password for user
 * - role: User role - 'admin' or 'user' but user by default.
 * - phone: Phone number of user
 */
const userSchema = new Schema({
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  phone: {
    type: String,
    required: true,
  },
  country_code: {
    type: String,
    required: true,
  }
},{timestamps:true});

const User = mongoose.model('User', userSchema);
module.exports = User;
