const mongoose = require('mongoose');

const auditLog = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
}, { timestamps: true });
const AuditLog = mongoose.model('AuditLog', auditLog);

module.exports = AuditLog;