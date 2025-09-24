const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');

class EvaluationService {
  // Create a new evaluation (exclude timeKeepingRecord)
  static async createEvaluation(evaluationData, evaluatorId) {
    const {
      evaluateeUser,
      attendanceAndPunctuality,
      qualityOfWorkOutput,
      quantityOfWorkOutput,
      attitudeAndWorkBehavior,
      remarksAndRecommendationByImmediateSupervisor,
      remarksCommentsByTheNAS,
      overallRating
    } = evaluationData;

    // Validate evaluateeUser
    if (!evaluateeUser || !mongoose.Types.ObjectId.isValid(evaluateeUser)) {
      throw new Error('Valid evaluateeUser ID is required');
    }
    
    const userExists = await User.findById(evaluateeUser);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Check if the user has a completed interview
    const application = await ApplicationForm.findOne({ user: evaluateeUser });
    if (!application) {
      throw new Error('No application found for this user');
    }
    
    const interview = await Interview.findOne({ applicationId: application._id });
    if (!interview) {
      throw new Error('No interview found for this applicant. Interview must be completed before evaluation.');
    }
    
    // Check if interview is completed
    const now = new Date();
    if (!interview.endTime || interview.endTime > now) {
      throw new Error('Interview must be completed before evaluation can be created.');
    }

    // Create evaluation
    const evaluation = new Evaluation({
      evaluatorUser: evaluatorId,
      evaluateeUser,
      attendanceAndPunctuality,
      qualityOfWorkOutput,
      quantityOfWorkOutput,
      attitudeAndWorkBehavior,
      remarksAndRecommendationByImmediateSupervisor,
      remarksCommentsByTheNAS,
      overallRating
    });

    await evaluation.save();
    
    const savedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('evaluatorUser', 'name email')
      .populate('evaluateeUser', 'name email');

    return {
      message: 'Evaluation created successfully',
      evaluation: savedEvaluation
    };
  }

  // Get all evaluations with pagination and filtering
  static async getAllEvaluations(options = {}) {
    const { page = 1, limit = 10, evaluateeUser } = options;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    const query = {};
    if (evaluateeUser && mongoose.Types.ObjectId.isValid(evaluateeUser)) {
      query.evaluateeUser = evaluateeUser;
    }

    const evaluations = await Evaluation.find(query)
      .populate('evaluatorUser', 'name email')
      .populate('evaluateeUser', 'name email')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Evaluation.countDocuments(query);

    return {
      evaluations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  // Get evaluation by ID
  static async getEvaluationById(evaluationId) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findById(evaluationId)
      .populate('evaluatorUser', 'name email')
      .populate('evaluateeUser', 'name email');

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return { evaluation };
  }

  // Update evaluation (exclude timeKeepingRecord)
  static async updateEvaluation(evaluationId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new Error('Invalid evaluation ID');
    }

    // Remove timeKeepingRecord from update data for security
    const { timeKeepingRecord, ...allowedUpdates } = updateData;

    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const evaluation = await Evaluation.findByIdAndUpdate(
      evaluationId,
      allowedUpdates,
      { new: true, runValidators: true }
    )
    .populate('evaluatorUser', 'name email')
    .populate('evaluateeUser', 'name email');

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return {
      message: 'Evaluation updated successfully',
      evaluation
    };
  }

  // Delete evaluation
  static async deleteEvaluation(evaluationId) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findByIdAndDelete(evaluationId);
    
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return { message: 'Evaluation deleted successfully' };
  }

  // Update time keeping record
  static async updateTimeKeepingRecord(evaluationId, timeKeepingData) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    evaluation.timeKeepingRecord = timeKeepingData;
    await evaluation.save();

    const updatedEvaluation = await Evaluation.findById(evaluationId)
      .populate('evaluatorUser', 'name email')
      .populate('evaluateeUser', 'name email');

    return {
      message: 'Time keeping record updated successfully',
      evaluation: updatedEvaluation
    };
  }

  // Get time keeping record
  static async getTimeKeepingRecord(evaluationId) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findById(evaluationId)
      .select('timeKeepingRecord evaluateeUser')
      .populate('evaluateeUser', 'name email');

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return {
      timeKeepingRecord: evaluation.timeKeepingRecord,
      evaluateeUser: evaluation.evaluateeUser
    };
  }
}

module.exports = EvaluationService;