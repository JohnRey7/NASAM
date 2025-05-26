const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Permission name must be at least 3 characters long']
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});


module.exports = mongoose.model('Permission', permissionSchema);