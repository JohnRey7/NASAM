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
  is_deleted: { type: Boolean, default: false },
  emailVerification: {
    code: String,
    expiresAt: Date,
    lastSentAt: Date,
    pendingEmail: String,
    isPasswordReset: { type: Boolean, default: false },
  },
  // Optional gender field. Restrict new values to 'Male' or 'Female'.
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    index: true,
    required: false,
  },
  // Personal information fields
  address: { type: String },
  contact: { type: String },
  birthday: { type: Date },
  // Location fields
  province: { type: String },
  city: { type: String },
  barangay: { type: String },
  street: { type: String },
  postalCode: { type: String },
});

module.exports = mongoose.model('User', userSchema);