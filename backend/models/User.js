// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, unique: true },
  password: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: [true, 'Role is required'] },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  disabled: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  emailVerification: {
    code: String,
    expiresAt: Date,
    lastSentAt: Date,
    pendingEmail: String,
  },
});

module.exports = mongoose.model('User', userSchema);