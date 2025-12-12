const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const Interview = require('../models/Interview');
const ApplicationForm = require('../models/ApplicationForm');
const EvaluationPeriod = require('../models/EvaluationPeriod');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');
const NotificationService = require('./NotificationService');

// Helper function to convert Decimal128 values to regular numbers
const convertDecimal128ToNumber = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  // If it's a Decimal128, convert to number
  if (obj._bsontype === 'Decimal128' || (obj.$numberDecimal !== undefined)) {
    return parseFloat(obj.toString());
  }

  // If it's an ObjectId, return as is
  if (obj instanceof mongoose.Types.ObjectId || obj._bsontype === 'ObjectID') {
    return obj;
  }
  
  // If it's an array, convert each element
  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimal128ToNumber(item));
  }
  
  // If it's an object, recursively convert each property
  if (typeof obj === 'object') {
    // Handle Date objects
    if (obj instanceof Date) return obj;

    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertDecimal128ToNumber(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

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
        semester: providedSemester,
        schoolYear: providedSchoolYear
      } = evaluationData;

      // Get current open evaluation period
      const currentPeriod = await EvaluationPeriod.findOne({ isOpen: true });
      
      // Use semester from current evaluation period if not provided
      let semester = providedSemester;
      let schoolYear = providedSchoolYear;
      
      if (currentPeriod) {
        // Use the current period's semester and school year if not explicitly provided
        if (!semester) {
          semester = currentPeriod.semester;
        }
        if (!schoolYear) {
          // Convert school year format from "2025-2026" to "2526"
          const yearParts = currentPeriod.schoolYear.split('-');
          if (yearParts.length === 2) {
            schoolYear = `${yearParts[0].slice(-2)}${yearParts[1].slice(-2)}`;
          }
        }
      }
      
      // If still no semester, use fallback or throw error
      if (!semester || !['First Semester', 'Second Semester', 'Third Semester', 'Summer'].includes(semester)) {
        throw new Error('No open evaluation period found. Please contact OAS to open an evaluation period.');
      }

      // Validate/get schoolYear - must be 4 digits like '2526'
      if (!schoolYear) {
        schoolYear = this.getCurrentSchoolYear();
      }
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
        schoolYear,
        // Determine evaluation status based on overall rating
        // Passed: >= 3.0 (Average or above), Failed: < 3.0
        evaluationStatus: parseFloat(overallRating) >= 3.0 ? 'passed' : 'failed'
      });
      
      console.log(`📊 Creating evaluation with status: ${evaluation.evaluationStatus} (Rating: ${overallRating})`);
      await evaluation.save();

      // If evaluation passed, update the application status to 'approved'
      const evaluationPassed = parseFloat(overallRating) >= 3.0;
      if (evaluationPassed) {
        await ApplicationForm.findByIdAndUpdate(
          application._id,
          { status: 'approved' },
          { new: true }
        );
        console.log('✅ Application status updated to approved for user:', evaluateeUser);
      } else {
        await ApplicationForm.findByIdAndUpdate(
          application._id,
          { status: 'rejected' },
          { new: true }
        );
        console.log('⚠️ Evaluation failed (rating < 3.0), application status updated to rejected for user:', evaluateeUser);
      }

      const populatedEvaluation = await Evaluation.findById(evaluation._id)
        .populate('evaluateeUser', 'name email idNumber');

      // Send notification to the scholar about their evaluation
      try {
        const ratingPeriod = `${semester} S.Y. ${this.schoolYearToLong(schoolYear)}`;
        const statusMessage = evaluationPassed ? 'passed' : 'failed';
        await NotificationService.createEvaluationSubmittedNotification(
          evaluateeUser,
          application._id,
          'Your Department Head',
          ratingPeriod,
          statusMessage
        );
        console.log('✅ Evaluation notification sent to scholar:', evaluateeUser);
      } catch (notificationError) {
        console.error('⚠️ Failed to send evaluation notification:', notificationError);
      }
      
      return populatedEvaluation;
    } catch (error) {
      console.error('Error creating evaluation:', error);
      throw error;
    }
  }

  static async getAllEvaluations(queryParams) {
    try {
      const { page = 1, limit = 10, search = '', semester = '', includeDeleted = false } = queryParams;
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        throw new Error('Invalid page number');
      }
      if (isNaN(limitNum) || limitNum < 1) {
        throw new Error('Invalid limit');
      }

      // Build query - handle includeDeleted parameter
      const query = {};
      
      // Filter by deleted status
      if (includeDeleted === true || includeDeleted === 'true') {
        query.is_deleted = true; // Only show deleted
      } else {
        query.is_deleted = false; // Only show active
      }
      
      if (search) {
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { idNumber: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
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
        .sort({ createdAt: -1 })
        .lean();
      
      // Convert Decimal128 values to regular numbers
      return evaluations.map(e => convertDecimal128ToNumber(e));
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
        .sort({ createdAt: -1 })
        .lean();
      
      // Convert Decimal128 values to regular numbers
      return evaluations.map(e => convertDecimal128ToNumber(e));
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
        .sort({ createdAt: -1 })
        .lean();
      
      // Convert Decimal128 values to regular numbers
      return evaluation ? convertDecimal128ToNumber(evaluation) : null;
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
      })
        .populate('evaluateeUser', 'name email idNumber')
        .lean();
      
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      // Convert Decimal128 values to regular numbers
      return convertDecimal128ToNumber(evaluation);
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

      // Automatically calculate and set evaluationStatus based on overallRating
      // 3.0 and above = passed, below 3.0 = failed
      if (overallRating !== undefined) {
        const evaluationPassed = parseFloat(overallRating) >= 3.0;
        evaluation.evaluationStatus = evaluationPassed ? 'passed' : 'failed';
        console.log(`📊 Evaluation status automatically set to: ${evaluation.evaluationStatus} (Rating: ${overallRating})`);
      }

      await evaluation.save();

      // Sync application status if overallRating changed
      if (overallRating !== undefined) {
        const application = await ApplicationForm.findOne({ user: evaluation.evaluateeUser });
        if (application) {
          const evaluationPassed = parseFloat(overallRating) >= 3.0;
          const newStatus = evaluationPassed ? 'approved' : 'rejected';
          
          console.log(`🔄 Syncing application status. Rating: ${overallRating}, Passed: ${evaluationPassed}, New Status: ${newStatus}, Old Status: ${application.status}`);

          if (application.status !== newStatus) {
             await ApplicationForm.findByIdAndUpdate(application._id, { status: newStatus });
             console.log(`✅ Application status updated to ${newStatus} for user:`, evaluation.evaluateeUser);
          }
        } else {
          console.log('⚠️ Application not found for user:', evaluation.evaluateeUser);
        }
      }

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

  // Soft delete all evaluations for a specific evaluation period (semester + school year)
  // This is called when an evaluation period ends
  static async softDeleteEvaluationsByPeriod(semester, schoolYear) {
    try {
      if (!semester || !['First Semester', 'Second Semester', 'Third Semester'].includes(semester)) {
        throw new Error('Valid semester is required');
      }

      if (!schoolYear || !/^\d{4}$/.test(schoolYear)) {
        throw new Error('Valid school year is required (e.g., 2526 for 2025-2026)');
      }

      const result = await Evaluation.updateMany(
        {
          semester,
          schoolYear,
          is_deleted: false
        },
        {
          is_deleted: true,
          deletedAt: new Date()
        }
      );

      console.log(`✅ Soft deleted ${result.modifiedCount} evaluations for ${semester} S.Y. ${this.schoolYearToLong(schoolYear)}`);
      
      return {
        message: `Successfully archived ${result.modifiedCount} evaluations for ${semester} S.Y. ${this.schoolYearToLong(schoolYear)}`,
        deletedCount: result.modifiedCount,
        semester,
        schoolYear: this.schoolYearToLong(schoolYear)
      };
    } catch (error) {
      console.error('Error soft deleting evaluations by period:', error);
      throw error;
    }
  }

  // Restore all evaluations for a specific evaluation period
  static async restoreEvaluationsByPeriod(semester, schoolYear) {
    try {
      if (!semester || !['First Semester', 'Second Semester', 'Third Semester'].includes(semester)) {
        throw new Error('Valid semester is required');
      }

      if (!schoolYear || !/^\d{4}$/.test(schoolYear)) {
        throw new Error('Valid school year is required (e.g., 2526 for 2025-2026)');
      }

      const result = await Evaluation.updateMany(
        {
          semester,
          schoolYear,
          is_deleted: true
        },
        {
          is_deleted: false,
          $unset: { deletedAt: 1 }
        }
      );

      console.log(`✅ Restored ${result.modifiedCount} evaluations for ${semester} S.Y. ${this.schoolYearToLong(schoolYear)}`);
      
      return {
        message: `Successfully restored ${result.modifiedCount} evaluations for ${semester} S.Y. ${this.schoolYearToLong(schoolYear)}`,
        restoredCount: result.modifiedCount,
        semester,
        schoolYear: this.schoolYearToLong(schoolYear)
      };
    } catch (error) {
      console.error('Error restoring evaluations by period:', error);
      throw error;
    }
  }

  // Admin-specific user-based evaluation methods

  // Get evaluation by userId (gets the latest evaluation)
  static async getEvaluationByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Find the latest evaluation for this user
      const evaluation = await Evaluation.findOne({
        evaluateeUser: userId,
        is_deleted: false
      })
        .sort({ createdAt: -1 })
        .populate('evaluateeUser', 'name email idNumber')
        .lean();

      if (!evaluation) {
        throw new Error('No evaluation found for this user');
      }

      // Convert Decimal128 values to numbers
      return convertDecimal128ToNumber(evaluation);
    } catch (error) {
      console.error('Error getting evaluation by userId:', error);
      throw error;
    }
  }

  // Create evaluation by userId
  static async createEvaluationByUserId(userId, evaluationData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Find user and get their idNumber
      const user = await User.findById(userId).select('idNumber role');
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has applicant role
      const Role = require('../models/Role');
      const userRole = await Role.findById(user.role);
      if (!userRole || userRole.name !== 'applicant') {
        throw new Error('User must have applicant role to receive evaluations');
      }

      // Use the existing createEvaluation method with idNumber
      return await this.createEvaluation({
        ...evaluationData,
        idNumber: user.idNumber
      });
    } catch (error) {
      console.error('Error creating evaluation by userId:', error);
      throw error;
    }
  }

  // Update evaluation by userId (updates the latest evaluation)
  static async updateEvaluationByUserId(userId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Find the latest evaluation for this user
      const evaluation = await Evaluation.findOne({
        evaluateeUser: userId,
        is_deleted: false
      }).sort({ createdAt: -1 });

      if (!evaluation) {
        throw new Error('No evaluation found for this user');
      }

      // Use the existing updateEvaluation method
      return await this.updateEvaluation(evaluation._id, updateData);
    } catch (error) {
      console.error('Error updating evaluation by userId:', error);
      throw error;
    }
  }

  // Soft delete evaluation by userId (soft deletes the latest evaluation)
  static async softDeleteEvaluationByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Find the latest non-deleted evaluation for this user
      const evaluation = await Evaluation.findOne({
        evaluateeUser: userId,
        is_deleted: false
      }).sort({ createdAt: -1 });

      if (!evaluation) {
        throw new Error('No active evaluation found for this user');
      }

      // Use the existing softDeleteEvaluation method
      return await this.softDeleteEvaluation(evaluation._id);
    } catch (error) {
      console.error('Error soft deleting evaluation by userId:', error);
      throw error;
    }
  }

  // Permanently delete evaluation by userId (permanently deletes the latest evaluation)
  static async permanentDeleteEvaluationByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Find the latest evaluation for this user (including soft-deleted)
      const evaluation = await Evaluation.findOne({
        evaluateeUser: userId
      }).sort({ createdAt: -1 });

      if (!evaluation) {
        throw new Error('No evaluation found for this user');
      }

      // Use the existing permanentDeleteEvaluation method
      return await this.permanentDeleteEvaluation(evaluation._id);
    } catch (error) {
      console.error('Error permanently deleting evaluation by userId:', error);
      throw error;
    }
  }

  // Restore evaluation by userId (restores the latest soft-deleted evaluation)
  static async restoreEvaluationByUserId(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Find the latest soft-deleted evaluation for this user
      const evaluation = await Evaluation.findOne({
        evaluateeUser: userId,
        is_deleted: true
      }).sort({ createdAt: -1 });

      if (!evaluation) {
        throw new Error('No deleted evaluation found for this user');
      }

      // Use the existing restoreEvaluation method
      return await this.restoreEvaluation(evaluation._id);
    } catch (error) {
      console.error('Error restoring evaluation by userId:', error);
      throw error;
    }
  }
}

module.exports = EvaluationService;