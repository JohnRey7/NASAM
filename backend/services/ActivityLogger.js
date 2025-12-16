// CREATE FILE: backend/services/ActivityLogger.js
const ApplicationActivityLog = require('../models/ApplicationActivityLog');

class ActivityLogger {
  // Log application submission
  static async logApplicationSubmission(userId, applicationId, scholarshipType = 'scholarship') {
    try {
      const log = new ApplicationActivityLog({
        userId,
        applicationId,
        activityType: 'application_submitted',
        title: 'Application Submitted',
        description: `Application submitted for ${scholarshipType} program`,
        status: 'Pending',
        metadata: {
          scholarshipType,
          submissionDate: new Date()
        },
        isSystemGenerated: true
      });
      await log.save();
      console.log('✅ Application submission logged');
      return log;
    } catch (error) {
      console.error('❌ Failed to log application submission:', error);
    }
  }

  // Log document upload
  static async logDocumentUpload(userId, applicationId, fileName, fileType) {
    try {
      const log = new ApplicationActivityLog({
        userId,
        applicationId,
        activityType: 'document_uploaded',
        title: 'Document Uploaded',
        description: `Uploaded ${fileType}: ${fileName}`,
        status: 'Pending',
        metadata: {
          fileName,
          fileType,
          uploadDate: new Date()
        },
        isSystemGenerated: true
      });
      await log.save();
      console.log('✅ Document upload logged');
      return log;
    } catch (error) {
      console.error('❌ Failed to log document upload:', error);
    }
  }

  // Log personality test activities
  static async logPersonalityTest(userId, applicationId, action, metadata = {}) {
    try {
      const titles = {
        'personality_test_started': 'Personality Test Started',
        'personality_test_completed': 'Personality Test Completed',
        'personality_test_stopped': 'Personality Test Stopped'
      };

      const descriptions = {
        'personality_test_started': 'Started taking the personality assessment test',
        'personality_test_completed': `Completed personality test with score: ${metadata.score || 'N/A'}`,
        'personality_test_stopped': 'Personality test session was stopped'
      };

      const log = new ApplicationActivityLog({
        userId,
        applicationId,
        activityType: action,
        title: titles[action],
        description: descriptions[action],
        status: action === 'personality_test_completed' ? 'Completed' : 'In Progress',
        metadata: {
          ...metadata,
          testDate: new Date()
        },
        isSystemGenerated: true
      });
      await log.save();
      console.log(`✅ ${action} logged`);
      return log;
    } catch (error) {
      console.error(`❌ Failed to log ${action}:`, error);
    }
  }

  // Log PDF export
  static async logPDFExport(userId, applicationId) {
    try {
      const log = new ApplicationActivityLog({
        userId,
        applicationId,
        activityType: 'pdf_exported',
        title: 'Application PDF Downloaded',
        description: 'Downloaded application form as PDF',
        status: 'Completed',
        metadata: {
          exportDate: new Date()
        },
        isSystemGenerated: true
      });
      await log.save();
      console.log('✅ PDF export logged');
      return log;
    } catch (error) {
      console.error('❌ Failed to log PDF export:', error);
    }
  }

  // Log application updates (status changes, edits, deletions, etc.)
  static async logApplicationUpdate(userId, applicationId, action, metadata = {}) {
    try {
      const titles = {
        'application_soft_deleted': 'Application Deleted',
        'application_restored': 'Application Restored',
        'application_edited': 'Application Edited',
        'status_changed': 'Status Changed',
        'application_approved': 'Application Approved',
        'application_rejected': 'Application Rejected'
      };

      const descriptions = {
        'application_soft_deleted': 'Application and related data have been deleted',
        'application_restored': 'Application has been restored from deleted state',
        'application_edited': 'Application information was updated',
        'status_changed': `Status changed to: ${metadata.newStatus || 'N/A'}`,
        'application_approved': 'Application has been approved',
        'application_rejected': `Application has been rejected. Reason: ${metadata.reason || 'N/A'}`
      };

      const log = new ApplicationActivityLog({
        userId,
        applicationId,
        activityType: action,
        title: titles[action] || 'Application Updated',
        description: descriptions[action] || `Application update: ${action}`,
        status: metadata.status || 'Completed',
        metadata: {
          ...metadata,
          updateDate: new Date()
        },
        isSystemGenerated: true,
        adminNotes: metadata.adminNotes
      });
      await log.save();
      console.log(`✅ ${action} logged`);
      return log;
    } catch (error) {
      console.error(`❌ Failed to log ${action}:`, error);
    }
  }

  // Get user's activity history
  static async getUserActivityHistory(userId, limit = 50) {
    try {
      const history = await ApplicationActivityLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('applicationId', 'typeOfScholarship status')
        .lean();

      return history.map(log => ({
        id: log._id,
        type: log.activityType,
        title: log.title,
        description: log.description,
        status: log.status,
        date: log.timestamp,
        metadata: log.metadata,
        adminNotes: log.adminNotes
      }));
    } catch (error) {
      console.error('❌ Failed to get user activity history:', error);
      return [];
    }
  }
}

module.exports = ActivityLogger;