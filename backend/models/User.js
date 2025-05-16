// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, unique: true },
  password: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  disabled: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  emailVerification: {
    code: String,
    expiresAt: Date,
    lastSentAt: Date,
    verified: { type: Boolean, default: false },
    pendingEmail: String,
  },
});

module.exports = mongoose.model('User', userSchema);