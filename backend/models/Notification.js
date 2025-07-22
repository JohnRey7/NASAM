const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'general',
      'application_submitted',
      'application_form_verified',
      'application_status',
      'documents_submitted',
      'document_uploaded',
      'documents_verified',
      'document_status',
      'interview_scheduled',
      'personality_test_available',
      'personality_test_completed',
      'scholarship_approved',
      'scholarship_rejected',
      'progress_update',
      'status_change'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApplicationForm'
    }
  }
});

module.exports = mongoose.model('Notification', notificationSchema);