const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class EvaluationService {
  static async createEvaluation(evaluationData) {
    try {
      // Validate request body
      if (!evaluationData || typeof evaluationData !== 'object') {
        throw new Error('Evaluation data is required');
      }

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
    } catch (error) {
      console.error('Error creating evaluation:', error);
      throw error;
    }
  }

  static async getAllEvaluations(queryParams) {
    try {
      const { page = 1, limit = 10, search = '' } = queryParams;
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

      // Fetch evaluations
      const evaluations = await Evaluation.find(query)
        .populate('evaluateeUser', 'name email')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      const total = await Evaluation.countDocuments(query);

      return {
        data: evaluations,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      };
    } catch (error) {
      console.error('Error getting all evaluations:', error);
      throw error;
    }
  }

  static async getEvaluationById(idNumber) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Find evaluation by user ObjectId
      const evaluation = await Evaluation.findOne({ evaluateeUser: user._id, is_deleted: false })
        .populate('evaluateeUser', 'name email idNumber');
      
      if (!evaluation) {
        throw new Error('Evaluation not found for this user');
      }

      return evaluation;
    } catch (error) {
      console.error('Error getting evaluation by ID number:', error);
      throw error;
    }
  }

  static async updateEvaluation(idNumber, updateData) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Validate request body
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Update data is required');
      }

      const {
        attendanceAndPunctuality,
        qualityOfWorkOutput,
        quantityOfWorkOutput,
        attitudeAndWorkBehavior,
        remarksAndRecommendationByImmediateSupervisor,
        remarksCommentsByTheNAS,
        overallRating
      } = updateData;

      // Find evaluation by user ObjectId
      const evaluation = await Evaluation.findOne({ evaluateeUser: user._id, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found for this user');
      }

      // Update fields (exclude evaluateeUser and timeKeepingRecord)
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
        .populate('evaluateeUser', 'name email idNumber');
      
      return populatedEvaluation;
    } catch (error) {
      console.error('Error updating evaluation:', error);
      throw error;
    }
  }

  static async deleteEvaluation(idNumber) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Find and delete evaluation by user ObjectId
      const evaluation = await Evaluation.findOneAndDelete({ evaluateeUser: user._id, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found for this user');
      }

      return { message: 'Evaluation deleted successfully' };
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      throw error;
    }
  }

  static async updateTimeKeepingRecord(idNumber, timeKeepingRecord) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Validate request body
      if (!timeKeepingRecord || typeof timeKeepingRecord !== 'object') {
        throw new Error('Time keeping record data is required');
      }

      // Validate timeKeepingRecord fields
      const fields = ['excusedAbsences', 'unexcusedAbsences', 'lateGreaterThanTenMinutes', 'lateGreaterThanOneHour', 'failureToPunch', 'underTime'];
      for (const field of fields) {
        if (timeKeepingRecord[field] !== undefined) {
          if (!Number.isInteger(timeKeepingRecord[field]) || timeKeepingRecord[field] < 0) {
            throw new Error(`${field} must be a non-negative integer`);
          }
        }
      }

      // Find evaluation by user ObjectId
      const evaluation = await Evaluation.findOne({ evaluateeUser: user._id, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found for this user');
      }

      // Update timeKeepingRecord
      evaluation.timeKeepingRecord = { ...evaluation.timeKeepingRecord, ...timeKeepingRecord };
      await evaluation.save();

      // Populate and return
      const populatedEvaluation = await Evaluation.findById(evaluation._id)
        .populate('evaluateeUser', 'name email idNumber');
      
      return populatedEvaluation;
    } catch (error) {
      console.error('Error updating time keeping record:', error);
      throw error;
    }
  }

  static async getTimeKeepingRecord(idNumber) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Find evaluation by user ObjectId
      const evaluation = await Evaluation.findOne({ evaluateeUser: user._id, is_deleted: false }).select('timeKeepingRecord');
      if (!evaluation) {
        throw new Error('Evaluation not found for this user');
      }

      return { timeKeepingRecord: evaluation.timeKeepingRecord };
    } catch (error) {
      console.error('Error getting time keeping record:', error);
      throw error;
    }
  }

  // Soft Delete Methods
  static async softDeleteEvaluation(idNumber) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Find evaluation by user ObjectId
      const evaluation = await Evaluation.findOne({ evaluateeUser: user._id, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found for this user');
      }

      const result = await SoftDeleteUtils.softDeleteById(Evaluation, evaluation._id);
      return { message: 'Evaluation soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting evaluation:', error);
      throw error;
    }
  }

  static async restoreEvaluation(idNumber) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Find soft-deleted evaluation by user ObjectId
      const evaluation = await Evaluation.findOne({ evaluateeUser: user._id, is_deleted: true });
      if (!evaluation) {
        throw new Error('Soft-deleted evaluation not found for this user');
      }

      const result = await SoftDeleteUtils.restoreById(Evaluation, evaluation._id);
      return { message: 'Evaluation restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring evaluation:', error);
      throw error;
    }
  }

  static async permanentDeleteEvaluation(idNumber) {
    try {
      // Find user by idNumber
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      // Find soft-deleted evaluation by user ObjectId
      const evaluation = await Evaluation.findOne({ evaluateeUser: user._id, is_deleted: true });
      if (!evaluation) {
        throw new Error('Soft-deleted evaluation not found for this user');
      }

      const result = await SoftDeleteUtils.permanentDeleteById(Evaluation, evaluation._id);
      return { message: 'Evaluation permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting evaluation:', error);
      throw error;
    }
  }

  static async getSoftDeletedEvaluations(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(Evaluation, query);
    } catch (error) {
      console.error('Error getting soft deleted evaluations:', error);
      throw error;
    }
  }
}

module.exports = EvaluationService;