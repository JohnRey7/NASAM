// CREATE FILE: backend/models/ApplicationActivityLog.js
const mongoose = require('mongoose');

const applicationActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationForm',
    index: true
  },
  activityType: {
    type: String,
    required: true,
    enum: [
      'application_submitted',
      'application_updated', 
      'document_uploaded',
      'document_deleted',
      'personality_test_started',
      'personality_test_completed',
      'personality_test_stopped',
      'status_changed',
      'pdf_exported',
      'application_viewed',
      'profile_updated'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Approved', 'Rejected', 'Document Verification', 'Interview Scheduled'],
    default: 'Pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Store additional data like file names, test scores, etc.
    default: {}
  },
  isSystemGenerated: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String // For admin-only notes
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true,
  collection: 'applicationactivitylogs'
});

// Indexes for better performance
applicationActivityLogSchema.index({ userId: 1, timestamp: -1 });
applicationActivityLogSchema.index({ applicationId: 1, timestamp: -1 });
applicationActivityLogSchema.index({ activityType: 1, timestamp: -1 });
applicationActivityLogSchema.index({ status: 1 });

const ApplicationActivityLog = mongoose.model('ApplicationActivityLog', applicationActivityLogSchema);

module.exports = ApplicationActivityLog;