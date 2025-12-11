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
      'application_status_update',
      'documents_submitted',
      'document_uploaded',
      'documents_verified',
      'document_status',
      'interview_scheduled',
      'interview_reminder',
      'interview_rescheduled',
      'personality_test_available',
      'personality_test_reviewed',
      'personality_test_completed',
      'scholarship_approved',
      'scholarship_rejected',
      'evaluation_period_opened',
      'evaluation_submitted',
      'progress_update',
      'status_change',
      'form_verified',
      'new_message'
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
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
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
  },
  is_deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', notificationSchema);