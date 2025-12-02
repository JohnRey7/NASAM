const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class EvaluationService {
  // Helper to get current school year in short format (e.g., '2526' for 2025-2026)
  static getCurrentSchoolYear() {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // School year starts in June
    if (currentMonth >= 5) { // June onwards (month 5 = June)
      const startYear = currentYear % 100; // e.g., 25 for 2025
      const endYear = (currentYear + 1) % 100; // e.g., 26 for 2026
      return `${startYear.toString().padStart(2, '0')}${endYear.toString().padStart(2, '0')}`;
    } else {
      const startYear = (currentYear - 1) % 100;
      const endYear = currentYear % 100;
      return `${startYear.toString().padStart(2, '0')}${endYear.toString().padStart(2, '0')}`;
    }
  }

  // Helper to convert short school year to long format (e.g., '2526' -> '2025-2026')
  static schoolYearToLong(shortYear) {
    if (!shortYear || shortYear.length !== 4) return shortYear;
    const startYear = parseInt(shortYear.substring(0, 2));
    const endYear = parseInt(shortYear.substring(2, 4));
    // Assume 2000s
    return `20${startYear.toString().padStart(2, '0')}-20${endYear.toString().padStart(2, '0')}`;
  }

  static async createEvaluation(evaluationData) {
    try {
      // Validate request body
      if (!evaluationData || typeof evaluationData !== 'object') {
        throw new Error('Evaluation data is required');
      }

      const {
        idNumber,
        evaluateeUser: providedEvaluateeUser,
        attendanceAndPunctuality,
        qualityOfWorkOutput,
        quantityOfWorkOutput,
        attitudeAndWorkBehavior,
        remarksAndRecommendationByImmediateSupervisor,
        remarksCommentsByTheNAS,
        timeKeepingRecord,
        overallRating,
        semester,
        schoolYear: providedSchoolYear
      } = evaluationData;

      // Validate semester
      if (!semester || !['First Semester', 'Second Semester', 'Third Semester'].includes(semester)) {
        throw new Error('Valid semester is required (First Semester, Second Semester, or Third Semester)');
      }

      // Validate schoolYear - must be 4 digits like '2526'
      const schoolYear = providedSchoolYear || this.getCurrentSchoolYear();
      if (!schoolYear || !/^\d{4}$/.test(schoolYear)) {
        throw new Error('Valid school year is required (e.g., 2526 for 2025-2026)');
      }

      // Get evaluateeUser from idNumber if not directly provided
      let evaluateeUser = providedEvaluateeUser;
      
      if (!evaluateeUser && idNumber) {
        const user = await User.findOne({ idNumber: idNumber });
        if (!user) {
          throw new Error(`User with ID number ${idNumber} not found`);
        }
        evaluateeUser = user._id;
      }

      // Validate evaluateeUser
      if (!evaluateeUser || !mongoose.Types.ObjectId.isValid(evaluateeUser)) {
        throw new Error('Valid evaluateeUser ID or idNumber is required');
      }

      const userExists = await User.findById(evaluateeUser);
      if (!userExists) {
        throw new Error('User not found');
      }

      // Check if user has an application
      const application = await ApplicationForm.findOne({ user: evaluateeUser });
      if (!application) {
        throw new Error('No application found for this user');
      }
      
      // Check if evaluation already exists for this user, semester, and school year
      const existingEvaluation = await Evaluation.findOne({
        evaluateeUser,
        semester,
        schoolYear,
        is_deleted: false
      });

      if (existingEvaluation) {
        throw new Error(`Evaluation for ${semester} of school year ${this.schoolYearToLong(schoolYear)} already exists for this user`);
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
        timeKeepingRecord: timeKeepingRecord || {
          excusedAbsences: 0,
          unexcusedAbsences: 0,
          lateGreaterThanTenMinutes: 0,
          lateGreaterThanOneHour: 0,
          failureToPunch: 0,
          underTime: 0
        },
        overallRating,
        semester,
        schoolYear
      });
      await evaluation.save();

      const populatedEvaluation = await Evaluation.findById(evaluation._id)
        .populate('evaluateeUser', 'name email idNumber');
      
      return populatedEvaluation;
    } catch (error) {
      console.error('Error creating evaluation:', error);
      throw error;
    }
  }

  static async getAllEvaluations(queryParams) {
    try {
      const { page = 1, limit = 10, search = '', semester = '' } = queryParams;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error('Invalid page number');
      }
      if (isNaN(limitNum) || limitNum < 1) {
        throw new Error('Invalid limit');
      }

      // Build query
      const query = { is_deleted: false };
      
      if (search) {
        const users = await User.find({
          name: { $regex: search, $options: 'i' }
        }).select('_id');
        const userIds = users.map(user => user._id);
        query.evaluateeUser = { $in: userIds };
      }

      if (semester) {
        query.semester = semester;
      }

      const evaluations = await Evaluation.find(query)
        .populate('evaluateeUser', 'name email idNumber')
        .sort({ createdAt: -1 })
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

  // Get evaluations by user's idNumber (returns array)
  static async getEvaluationsByIdNumber(idNumber) {
    try {
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      const evaluations = await Evaluation.find({ 
        evaluateeUser: user._id, 
        is_deleted: false 
      })
        .populate('evaluateeUser', 'name email idNumber')
        .sort({ createdAt: -1 });
      
      return evaluations;
    } catch (error) {
      console.error('Error getting evaluations by ID number:', error);
      throw error;
    }
  }

  // Get evaluations by user ObjectId (returns array)
  static async getEvaluationsByUserId(userId) {
    try {
      const evaluations = await Evaluation.find({ 
        evaluateeUser: userId, 
        is_deleted: false 
      })
        .populate('evaluateeUser', 'name email idNumber')
        .sort({ createdAt: -1 });
      
      return evaluations;
    } catch (error) {
      console.error('Error getting evaluations by user ID:', error);
      throw error;
    }
  }

  // Get last evaluation by user ObjectId
  static async getLastEvaluationByUserId(userId) {
    try {
      const evaluation = await Evaluation.findOne({ 
        evaluateeUser: userId, 
        is_deleted: false 
      })
        .populate('evaluateeUser', 'name email idNumber')
        .sort({ createdAt: -1 });
      
      return evaluation;
    } catch (error) {
      console.error('Error getting last evaluation by user ID:', error);
      throw error;
    }
  }

  // Get evaluation by evaluationId
  static async getEvaluationById(evaluationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

      const evaluation = await Evaluation.findOne({ 
        _id: evaluationId, 
        is_deleted: false 
      }).populate('evaluateeUser', 'name email idNumber');
      
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      return evaluation;
    } catch (error) {
      console.error('Error getting evaluation by ID:', error);
      throw error;
    }
  }

  // Update evaluation by evaluationId
  static async updateEvaluation(evaluationId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

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
        timeKeepingRecord,
        overallRating,
        semester
      } = updateData;

      const evaluation = await Evaluation.findOne({ _id: evaluationId, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      // Update fields
      if (attendanceAndPunctuality) evaluation.attendanceAndPunctuality = attendanceAndPunctuality;
      if (qualityOfWorkOutput) evaluation.qualityOfWorkOutput = qualityOfWorkOutput;
      if (quantityOfWorkOutput) evaluation.quantityOfWorkOutput = quantityOfWorkOutput;
      if (attitudeAndWorkBehavior) evaluation.attitudeAndWorkBehavior = attitudeAndWorkBehavior;
      if (remarksAndRecommendationByImmediateSupervisor !== undefined) {
        evaluation.remarksAndRecommendationByImmediateSupervisor = remarksAndRecommendationByImmediateSupervisor;
      }
      if (remarksCommentsByTheNAS !== undefined) evaluation.remarksCommentsByTheNAS = remarksCommentsByTheNAS;
      if (timeKeepingRecord) evaluation.timeKeepingRecord = timeKeepingRecord;
      if (overallRating !== undefined) evaluation.overallRating = overallRating;
      if (semester) evaluation.semester = semester;

      await evaluation.save();

      const populatedEvaluation = await Evaluation.findById(evaluation._id)
        .populate('evaluateeUser', 'name email idNumber');
      
      return populatedEvaluation;
    } catch (error) {
      console.error('Error updating evaluation:', error);
      throw error;
    }
  }

  // Delete evaluation by evaluationId
  static async deleteEvaluation(evaluationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

      const evaluation = await Evaluation.findOneAndDelete({ _id: evaluationId, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      return { message: 'Evaluation deleted successfully' };
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      throw error;
    }
  }

  // Update timeKeepingRecord by evaluationId
  static async updateTimeKeepingRecord(evaluationId, timeKeepingRecord) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

      if (!timeKeepingRecord || typeof timeKeepingRecord !== 'object') {
        throw new Error('Time keeping record data is required');
      }

      const fields = ['excusedAbsences', 'unexcusedAbsences', 'lateGreaterThanTenMinutes', 'lateGreaterThanOneHour', 'failureToPunch', 'underTime'];
      for (const field of fields) {
        if (timeKeepingRecord[field] !== undefined) {
          if (!Number.isInteger(timeKeepingRecord[field]) || timeKeepingRecord[field] < 0) {
            throw new Error(`${field} must be a non-negative integer`);
          }
        }
      }

      const evaluation = await Evaluation.findOne({ _id: evaluationId, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      evaluation.timeKeepingRecord = { ...evaluation.timeKeepingRecord.toObject(), ...timeKeepingRecord };
      await evaluation.save();

      const populatedEvaluation = await Evaluation.findById(evaluation._id)
        .populate('evaluateeUser', 'name email idNumber');
      
      return populatedEvaluation;
    } catch (error) {
      console.error('Error updating time keeping record:', error);
      throw error;
    }
  }

  // Get timeKeepingRecord by evaluationId
  static async getTimeKeepingRecord(evaluationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

      const evaluation = await Evaluation.findOne({ _id: evaluationId, is_deleted: false }).select('timeKeepingRecord');
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      return { timeKeepingRecord: evaluation.timeKeepingRecord };
    } catch (error) {
      console.error('Error getting time keeping record:', error);
      throw error;
    }
  }

  // Soft Delete by evaluationId
  static async softDeleteEvaluation(evaluationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

      const evaluation = await Evaluation.findOne({ _id: evaluationId, is_deleted: false });
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      const result = await SoftDeleteUtils.softDeleteById(Evaluation, evaluationId);
      return { message: 'Evaluation soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting evaluation:', error);
      throw error;
    }
  }

  // Restore by evaluationId
  static async restoreEvaluation(evaluationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

      const evaluation = await Evaluation.findOne({ _id: evaluationId, is_deleted: true });
      if (!evaluation) {
        throw new Error('Soft-deleted evaluation not found');
      }

      const result = await SoftDeleteUtils.restoreById(Evaluation, evaluationId);
      return { message: 'Evaluation restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring evaluation:', error);
      throw error;
    }
  }

  // Permanent delete by evaluationId
  static async permanentDeleteEvaluation(evaluationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
        throw new Error('Invalid evaluation ID');
      }

      const evaluation = await Evaluation.findOne({ _id: evaluationId, is_deleted: true });
      if (!evaluation) {
        throw new Error('Soft-deleted evaluation not found');
      }

      const result = await SoftDeleteUtils.permanentDeleteById(Evaluation, evaluationId);
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

  // Get available semesters for a user (semesters not yet evaluated in specified school year)
  static async getAvailableSemestersForUser(idNumber, schoolYear = null) {
    try {
      const user = await User.findOne({ idNumber });
      if (!user) {
        throw new Error('User not found with the provided ID number');
      }

      const allSemesters = ['First Semester', 'Second Semester', 'Third Semester'];
      const targetSchoolYear = schoolYear || this.getCurrentSchoolYear();

      // Find existing evaluations for this user in the specified school year
      const existingEvaluations = await Evaluation.find({
        evaluateeUser: user._id,
        schoolYear: targetSchoolYear,
        is_deleted: false
      }).select('semester schoolYear');

      const takenSemesters = existingEvaluations
        .map(e => e.semester)
        .filter(Boolean); // Filter out undefined/null

      const availableSemesters = allSemesters.filter(s => !takenSemesters.includes(s));

      return {
        availableSemesters,
        takenSemesters,
        schoolYear: targetSchoolYear,
        schoolYearLong: this.schoolYearToLong(targetSchoolYear)
      };
    } catch (error) {
      console.error('Error getting available semesters:', error);
      throw error;
    }
  }

  // Get evaluation status for a user by their user ID (uses last evaluation)
  static async getEvaluationStatusByUserId(userId) {
    try {
      const evaluation = await Evaluation.findOne({ 
        evaluateeUser: userId, 
        is_deleted: false 
      })
        .populate('evaluateeUser', 'name email idNumber')
        .sort({ createdAt: -1 });
      
      if (!evaluation) {
        return {
          hasEvaluation: false,
          message: 'No evaluation found for this user'
        };
      }

      const overallRating = evaluation.overallRating 
        ? parseFloat(evaluation.overallRating.toString()) 
        : 0;
      
      const PASSING_GRADE = 3.0;
      const status = overallRating >= PASSING_GRADE ? 'passed' : 'failed';

      return {
        hasEvaluation: true,
        grade: overallRating,
        status: status,
        passingGrade: PASSING_GRADE,
        evaluationId: evaluation._id,
        semester: evaluation.semester,
        evaluatedAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt
      };
    } catch (error) {
      console.error('Error getting evaluation status by user ID:', error);
      throw error;
    }
  }
}

module.exports = EvaluationService;