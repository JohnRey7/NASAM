const ApplicationForm = require('../models/ApplicationForm');
const DocumentUpload = require('../models/DocumentUpload');
const PersonalityTest = require('../models/PersonalityTest');
const Interview = require('../models/Interview');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const mongoose = require('mongoose');

class ApplicationStatusService {
  /**
   * Get comprehensive application status for a user
   * @param {string} userId - The user's ID
   * @returns {Object} Comprehensive status object
   */
  static async getComprehensiveStatus(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Get application form status
      const application = await ApplicationForm.findOne({ 
        user: userId, 
        is_deleted: { $ne: true } 
      }).lean();

      // Debug: Log the application status from database
      console.log(`🔍 [ApplicationStatusService] User ${userId} - DB application status: ${application?.status || 'no application'}`);

      // Get documents status
      const documents = await DocumentUpload.findOne({ 
        user: userId, 
        is_deleted: { $ne: true } 
      }).lean();

      // Get personality test status - uses applicationId, not user
      let personalityTest = null;
      if (application) {
        personalityTest = await PersonalityTest.findOne({ 
          applicationId: application._id, 
          is_deleted: { $ne: true } 
        }).lean();
      }

      // Get all interviews for the application - uses applicationId, not user
      let interviews = [];
      if (application) {
        interviews = await Interview.find({ 
          applicationId: application._id, 
          is_deleted: { $ne: true } 
        }).sort({ startTime: 1 }).lean();
      }

      // Get latest evaluation
      const evaluation = await Evaluation.findOne({ 
        evaluateeUser: userId, 
        is_deleted: { $ne: true } 
      }).sort({ createdAt: -1 }).lean();

      // Build response object
      const response = {
        applicationForm: this.getApplicationFormStatus(application),
        documents: this.getDocumentsStatus(documents, application),
        personalityTest: this.getPersonalityTestStatus(personalityTest),
        interview: this.getInterviewStatus(interviews),
        evaluation: this.getEvaluationStatus(evaluation),
        applicationStatus: this.getFinalApplicationStatus(application, evaluation)
      };

      return response;
    } catch (error) {
      console.error('Error getting comprehensive status:', error);
      throw error;
    }
  }

  /**
   * Get application form status
   */
  static getApplicationFormStatus(application) {
    if (!application) {
      return {
        status: 'not_submitted',
        message: 'Application form not submitted'
      };
    }

    const status = application.status || 'pending';
    const isVerified = ['form_verified', 'document_verification', 'interview_scheduled', 'pending_evaluation', 'approved', 'rejected'].includes(status);

    return {
      status: isVerified ? 'verified' : 'pending',
      submittedAt: application.createdAt,
      verifiedAt: application.formVerifiedAt || null,
      verifiedBy: application.formVerifiedBy || null,
      message: isVerified ? 'Application form verified' : 'Awaiting verification'
    };
  }

  /**
   * Get documents status
   */
  static getDocumentsStatus(documents, application) {
    if (!documents) {
      return {
        status: 'not_submitted',
        message: 'No documents uploaded',
        uploadedCount: 0,
        requiredCount: 7
      };
    }

    // Count uploaded documents
    const uploadedDocs = [];
    if (documents.studentPicture) uploadedDocs.push('studentPicture');
    if (documents.gradeReport?.length > 0) uploadedDocs.push('gradeReport');
    if (documents.incomeTaxReturn?.length > 0) uploadedDocs.push('incomeTaxReturn');
    if (documents.nbiClearance?.length > 0) uploadedDocs.push('nbiClearance');
    if (documents.goodMoralCertificate?.length > 0) uploadedDocs.push('goodMoralCertificate');
    if (documents.physicalCheckup?.length > 0) uploadedDocs.push('physicalCheckup');
    if (documents.homeLocationSketch?.length > 0) uploadedDocs.push('homeLocationSketch');

    const appStatus = application?.status || 'pending';
    const isVerified = ['document_verification', 'interview_scheduled', 'pending_evaluation', 'approved', 'rejected'].includes(appStatus);

    return {
      status: isVerified ? 'verified' : (uploadedDocs.length > 0 ? 'pending' : 'not_submitted'),
      message: isVerified ? 'Documents verified' : (uploadedDocs.length > 0 ? 'Awaiting verification' : 'No documents uploaded'),
      uploadedCount: uploadedDocs.length,
      requiredCount: 7,
      uploadedDocuments: uploadedDocs,
      verifiedAt: documents.verifiedAt || null,
      verifiedBy: documents.verifiedBy || null
    };
  }

  /**
   * Get personality test status
   */
  static getPersonalityTestStatus(personalityTest) {
    if (!personalityTest) {
      return {
        status: 'not_started',
        message: 'Personality test not started'
      };
    }

    // Personality test is completed if:
    // 1. It has an endTime, OR
    // 2. It has answers, OR
    // 3. It has been reviewed
    const isCompleted = !!(
      personalityTest.endTime || 
      (personalityTest.answers && personalityTest.answers.length > 0) ||
      personalityTest.reviewed
    );

    return {
      status: isCompleted ? 'completed' : 'in_progress',
      message: isCompleted ? 'Personality test completed' : 'Personality test in progress',
      completedAt: personalityTest.endTime || personalityTest.reviewedAt || null,
      assignedAt: personalityTest.createdAt,
      reviewed: personalityTest.reviewed || false,
      score: personalityTest.score ? parseFloat(personalityTest.score.toString()) : null,
      riskLevel: personalityTest.riskLevelIndicator || null
    };
  }

  /**
   * Get interview status
   */
  static getInterviewStatus(interviews) {
    if (!interviews || interviews.length === 0) {
      return {
        status: 'not_scheduled',
        message: 'No interviews scheduled',
        totalInterviews: 0,
        completedInterviews: 0,
        oasInterview: null,
        departmentHeadInterview: null,
        allInterviews: []
      };
    }

    // Find OAS interview (type: 'OAS')
    const oasInterview = interviews.find(i => i.type === 'OAS');

    // Find Department Head interview (type: 'DepartmentHead')
    const deptHeadInterview = interviews.find(i => i.type === 'DepartmentHead');

    // Check if all interviews are finished
    const allFinished = interviews.every(i => i.is_finished === true);
    const completedCount = interviews.filter(i => i.is_finished === true).length;

    let status = 'not_scheduled';
    let message = 'No interviews scheduled';

    if (allFinished && interviews.length > 0) {
      status = 'completed';
      message = 'All interviews completed';
    } else if (interviews.length > 0) {
      status = 'scheduled';
      message = `${completedCount}/${interviews.length} interview(s) completed`;
    }

    return {
      status,
      message,
      totalInterviews: interviews.length,
      completedInterviews: completedCount,
      oasInterview: oasInterview ? {
        scheduledDateTime: oasInterview.startTime,
        endDateTime: oasInterview.endTime,
        isFinished: oasInterview.is_finished === true,
        interviewer: oasInterview.interviewer || null
      } : null,
      departmentHeadInterview: deptHeadInterview ? {
        scheduledDateTime: deptHeadInterview.startTime,
        endDateTime: deptHeadInterview.endTime,
        isFinished: deptHeadInterview.is_finished === true,
        interviewer: deptHeadInterview.interviewer || null
      } : null,
      allInterviews: interviews.map(i => ({
        id: i._id,
        type: i.type || 'OAS',
        scheduledDateTime: i.startTime,
        endDateTime: i.endTime,
        isFinished: i.is_finished === true
      }))
    };
  }

  /**
   * Get evaluation status
   */
  static getEvaluationStatus(evaluation) {
    if (!evaluation) {
      return {
        status: 'not_evaluated',
        message: 'Not yet evaluated',
        grade: null,
        result: null
      };
    }

    const overallRating = evaluation.overallRating 
      ? parseFloat(evaluation.overallRating.toString()) 
      : 0;
    
    const PASSING_GRADE = 3.0;
    const passed = overallRating >= PASSING_GRADE;

    return {
      status: 'evaluated',
      message: passed ? 'Evaluation passed' : 'Evaluation failed',
      grade: overallRating,
      result: passed ? 'passed' : 'failed',
      passingGrade: PASSING_GRADE,
      evaluatedAt: evaluation.createdAt,
      semester: evaluation.semester,
      schoolYear: evaluation.schoolYear
    };
  }

  /**
   * Get final application status
   * The database status is the source of truth - it's set by OAS staff via the buttons.
   * We just format it for display.
   */
  static getFinalApplicationStatus(application, evaluation) {
    if (!application) {
      return {
        status: 'none',
        message: 'No application submitted',
        displayStatus: 'none'
      };
    }

    const dbStatus = application.status || 'pending';
    
    // Debug log
    console.log(`🔍 [getFinalApplicationStatus] application.status = "${application.status}", dbStatus = "${dbStatus}"`);

    const statusMessages = {
      'draft': 'Application in draft',
      'pending': 'Application pending review',
      'form_verified': 'Application form verified',
      'document_verification': 'Documents verified',
      'interview_scheduled': 'Interview scheduled',
      'pending_evaluation': 'Under consideration',
      'approved': 'Application approved',
      'rejected': 'Application rejected'
    };

    // Determine display status
    let displayStatus = dbStatus;
    if (dbStatus === 'pending_evaluation') {
      displayStatus = 'under_consideration';
    }

    return {
      status: dbStatus,
      message: statusMessages[dbStatus] || 'Unknown status',
      displayStatus: displayStatus,
      updatedAt: application.updatedAt
    };
  }

  /**
   * Get comprehensive status by user's ID number
   */
  static async getComprehensiveStatusByIdNumber(idNumber) {
    try {
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with this ID number');
      }
      return await this.getComprehensiveStatus(user._id);
    } catch (error) {
      console.error('Error getting status by ID number:', error);
      throw error;
    }
  }
}

module.exports = ApplicationStatusService;
