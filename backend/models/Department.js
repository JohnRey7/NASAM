const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentCode: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    trim: true,
    match: [/^[A-Za-z0-9]{2,10}$/, 'Department code must be 2-10 alphanumeric characters'],
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department_head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  is_deleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Department = mongoose.model('Department', departmentSchema, 'department');

module.exports = Department;