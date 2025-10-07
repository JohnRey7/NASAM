// models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { type: String, required: true }, // e.g. "applicationForm.update"
  module: { type: String, required: true }, // e.g. "Application Module"
  timestamp: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false } // ✅ instead of deleting
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
