const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

class EvaluationService {
  // Create a new evaluation (exclude timeKeepingRecord)
  static async createEvaluation({
    evaluateeUser,
    attendanceAndPunctuality,
    qualityOfWorkOutput,
    quantityOfWorkOutput,
    attitudeAndWorkBehavior,
    remarksAndRecommendationByImmediateSupervisor,
    remarksCommentsByTheNAS,
    overallRating
  }) {
    // Validate evaluateeUser
    if (!evaluateeUser || !mongoose.Types.ObjectId.isValid(evaluateeUser)) {
      throw new Error('Valid evaluateeUser ID is required');
    }
    
    const userExists = await User.findById(evaluateeUser);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Check if the user has a completed interview
    const Interview = require('../models/Interview');
    const ApplicationForm = require('../models/ApplicationForm');
    
    const application = await ApplicationForm.findOne({ user: evaluateeUser });
    if (!application) {
      throw new Error('No application found for this user');
    }
    
    const interview = await Interview.findOne({ applicationId: application._id });
    if (!interview) {
      throw new Error('No interview found for this applicant. Interview must be completed before evaluation.');
    }
    
    // Check if interview is completed (has both start and end time and end time is in the past)
    const now = new Date();
    if (!interview.endTime || interview.endTime > now) {
      throw new Error('Interview must be completed before evaluation can be created.');
    }

    // Validate required nested fields
    if (!attendanceAndPunctuality || !qualityOfWorkOutput || !quantityOfWorkOutput || !attitudeAndWorkBehavior || overallRating === undefined) {
      throw new Error('All required fields must be provided');
    }

    // Create evaluation
    const evaluation = new Evaluation({
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

    // Populate and return
    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('evaluateeUser', 'name email');
      
    return populatedEvaluation;
  }

  // Get all evaluations (paginated, with name search)
  static async getAllEvaluations({ page = 1, limit = 10, search = '' }) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    // Build query
    const query = {};
    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const userIds = users.map(user => user._id);
      query.evaluateeUser = { $in: userIds };
    }

    const skip = (pageNum - 1) * limitNum;

    const evaluations = await Evaluation.find(query)
      .populate('evaluateeUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalCount = await Evaluation.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      evaluations,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    };
  }

  // Get an evaluation by ID
  static async getEvaluationById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findById(id)
      .populate('evaluateeUser', 'name email');

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return evaluation;
  }

  // Update an evaluation (exclude timeKeepingRecord)
  static async updateEvaluation(id, {
    evaluateeUser,
    attendanceAndPunctuality,
    qualityOfWorkOutput,
    quantityOfWorkOutput,
    attitudeAndWorkBehavior,
    remarksAndRecommendationByImmediateSupervisor,
    remarksCommentsByTheNAS,
    overallRating
  }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    // Validate evaluateeUser if provided
    if (evaluateeUser) {
      if (!mongoose.Types.ObjectId.isValid(evaluateeUser)) {
        throw new Error('Invalid evaluateeUser ID');
      }
      const userExists = await User.findById(evaluateeUser);
      if (!userExists) {
        throw new Error('Evaluatee user not found');
      }
      evaluation.evaluateeUser = evaluateeUser;
    }

    // Update fields if provided
    if (attendanceAndPunctuality) evaluation.attendanceAndPunctuality = attendanceAndPunctuality;
    if (qualityOfWorkOutput) evaluation.qualityOfWorkOutput = qualityOfWorkOutput;
    if (quantityOfWorkOutput) evaluation.quantityOfWorkOutput = quantityOfWorkOutput;
    if (attitudeAndWorkBehavior) evaluation.attitudeAndWorkBehavior = attitudeAndWorkBehavior;
    if (remarksAndRecommendationByImmediateSupervisor !== undefined) {
      evaluation.remarksAndRecommendationByImmediateSupervisor = remarksAndRecommendationByImmediateSupervisor;
    }
    if (remarksCommentsByTheNAS !== undefined) evaluation.remarksCommentsByTheNAS = remarksCommentsByTheNAS;
    if (overallRating !== undefined) evaluation.overallRating = overallRating;

    await evaluation.save();

    // Populate and return
    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('evaluateeUser', 'name email');
      
    return populatedEvaluation;
  }

  // Delete an evaluation
  static async deleteEvaluation(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    await Evaluation.findByIdAndDelete(id);

    return { message: 'Evaluation deleted successfully' };
  }

  // Update timeKeepingRecord
  static async updateTimeKeepingRecord(id, timeKeepingRecord) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid evaluation ID');
    }

    if (!timeKeepingRecord || typeof timeKeepingRecord !== 'object') {
      throw new Error('Valid timeKeepingRecord is required');
    }

    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    evaluation.timeKeepingRecord = timeKeepingRecord;
    await evaluation.save();

    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('evaluateeUser', 'name email');
      
    return populatedEvaluation;
  }

  // Get timeKeepingRecord
  static async getTimeKeepingRecord(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid evaluation ID');
    }

    const evaluation = await Evaluation.findById(id)
      .populate('evaluateeUser', 'name email')
      .select('timeKeepingRecord evaluateeUser');

    if (!evaluation) {
      throw new Error('Evaluation not found');
    }

    return {
      evaluateeUser: evaluation.evaluateeUser,
      timeKeepingRecord: evaluation.timeKeepingRecord || {}
    };
  }

  // Get evaluations by user ID
  static async getEvaluationsByUserId(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const evaluations = await Evaluation.find({ evaluateeUser: userId })
      .populate('evaluateeUser', 'name email')
      .sort({ createdAt: -1 });

    return evaluations;
  }

  // Check if user has evaluation
  static async hasEvaluation(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const evaluation = await Evaluation.findOne({ evaluateeUser: userId });
    return !!evaluation;
  }

  // Get evaluation statistics
  static async getEvaluationStatistics() {
    const totalEvaluations = await Evaluation.countDocuments();
    
    const ratingDistribution = await Evaluation.aggregate([
      {
        $group: {
          _id: '$overallRating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const averageRating = await Evaluation.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$overallRating' }
        }
      }
    ]);

    return {
      totalEvaluations,
      ratingDistribution,
      averageRating: averageRating[0]?.averageRating || 0
    };
  }
}

module.exports = EvaluationService;