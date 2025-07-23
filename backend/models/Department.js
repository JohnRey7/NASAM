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
    required: [true, 'Department name is required'],
    trim: true,
    minlength: [3, 'Department name must be at least 3 characters'],
    maxlength: [100, 'Department name cannot exceed 100 characters']
  }
}, {
  timestamps: true
});

const Department = mongoose.model('Department', departmentSchema, 'department');

module.exports = Department;