const ScholarEvaluation = require('../models/ScholarEvaluation');
const EvaluationPeriod = require('../models/EvaluationPeriod');
const User = require('../models/User');
const ApplicationForm = require('../models/ApplicationForm');
const NotificationService = require('../services/NotificationService');
const AuditLogService = require('../services/AuditLogService');
const mongoose = require('mongoose');

const ScholarEvaluationController = {
  // ==================== EVALUATION PERIOD MANAGEMENT (ADMIN) ====================
  
  // Get current evaluation period status
  async getCurrentPeriod(req, res) {
    try {
      const currentPeriod = await EvaluationPeriod.findOne({ isOpen: true })
        .populate('openedBy', 'name email')
        .populate('closedBy', 'name email');
      
      if (!currentPeriod) {
        return res.json({
          success: true,
          isOpen: false,
          period: null
        });
      }
      
      res.json({
        success: true,
        isOpen: true,
        period: currentPeriod
      });
    } catch (error) {
      console.error('Error getting current period:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Open evaluation period (Admin only)
  async openEvaluationPeriod(req, res) {
    try {
      const { semester, schoolYear, notes } = req.body;
      
      if (!semester || !schoolYear) {
        return res.status(400).json({
          success: false,
          message: 'Semester and school year are required'
        });
      }
      
      // Check if there's already an open period
      const existingOpen = await EvaluationPeriod.findOne({ isOpen: true });
      if (existingOpen) {
        return res.status(400).json({
          success: false,
          message: 'An evaluation period is already open. Please close it first.'
        });
      }
      
      const ratingPeriod = `${semester} S.Y. ${schoolYear}`;
      
      // Create or update the period
      let period = await EvaluationPeriod.findOne({ semester, schoolYear });
      
      if (period) {
        period.isOpen = true;
        period.openedAt = new Date();
        period.openedBy = req.user.id;
        period.notes = notes || '';
        await period.save();
      } else {
        period = new EvaluationPeriod({
          semester,
          schoolYear,
          ratingPeriod,
          isOpen: true,
          openedAt: new Date(),
          openedBy: req.user.id,
          notes: notes || ''
        });
        await period.save();
      }
      
      // Send notifications to all department heads
      try {
        const departmentHeads = await User.find({
          role: 'department_head',
          is_deleted: false
        });
        
        for (const deptHead of departmentHeads) {
          await NotificationService.createNotification({
            userId: deptHead._id,
            type: 'evaluation_period_opened',
            title: 'Scholar Evaluations Now Open',
            message: `The evaluation period for ${ratingPeriod} is now open. Please evaluate your assigned scholars.`,
            priority: 'high',
            metadata: {
              periodId: period._id,
              semester,
              schoolYear,
              ratingPeriod
            }
          });
        }
        
        console.log(`📧 Sent evaluation period notifications to ${departmentHeads.length} department heads`);
      } catch (notifError) {
        console.error('Error sending notifications:', notifError);
        // Don't fail the request if notifications fail
      }
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: `Open Evaluation Period: ${ratingPeriod}`,
        module: 'Evaluation'
      });

      res.json({
        success: true,
        message: `Evaluation period opened for ${ratingPeriod}`,
        period
      });
    } catch (error) {
      console.error('Error opening evaluation period:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Close evaluation period (Admin only)
  async closeEvaluationPeriod(req, res) {
    try {
      const period = await EvaluationPeriod.findOne({ isOpen: true });
      
      if (!period) {
        return res.status(404).json({
          success: false,
          message: 'No open evaluation period found'
        });
      }
      
      period.isOpen = false;
      period.closedAt = new Date();
      period.closedBy = req.user.id;
      
      // Update statistics
      const evaluationCount = await ScholarEvaluation.countDocuments({
        semester: period.semester,
        schoolYear: period.schoolYear,
        is_deleted: false
      });
      
      period.totalEvaluations = evaluationCount;
      await period.save();
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: `Close Evaluation Period: ${period.ratingPeriod}`,
        module: 'Evaluation'
      });

      res.json({
        success: true,
        message: `Evaluation period closed for ${period.ratingPeriod}`,
        period
      });
    } catch (error) {
      console.error('Error closing evaluation period:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Get all evaluation periods (Admin only)
  async getAllPeriods(req, res) {
    try {
      const periods = await EvaluationPeriod.find()
        .populate('openedBy', 'name email')
        .populate('closedBy', 'name email')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        periods
      });
    } catch (error) {
      console.error('Error getting periods:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // ==================== EVALUATION CRUD (DEPARTMENT HEAD) ====================
  
  // Create evaluation for a scholar
  async createEvaluation(req, res) {
    try {
      const evaluationData = req.body;
      
      // Check if evaluation period is open
      const currentPeriod = await EvaluationPeriod.findOne({ isOpen: true });
      if (!currentPeriod) {
        return res.status(403).json({
          success: false,
          message: 'Evaluation period is currently closed'
        });
      }
      
      // Check if scholar exists
      const scholar = await User.findById(evaluationData.scholar);
      if (!scholar) {
        return res.status(404).json({
          success: false,
          message: 'Scholar not found'
        });
      }
      
      // Check if evaluation already exists for this period
      const existingEvaluation = await ScholarEvaluation.findOne({
        scholar: evaluationData.scholar,
        semester: currentPeriod.semester,
        schoolYear: currentPeriod.schoolYear,
        is_deleted: false
      });
      
      if (existingEvaluation) {
        return res.status(400).json({
          success: false,
          message: 'Evaluation already exists for this scholar in this period',
          evaluationId: existingEvaluation._id
        });
      }
      
      // Create evaluation
      const evaluation = new ScholarEvaluation({
        ...evaluationData,
        evaluatedBy: req.user.id,
        evaluatorName: req.user.name,
        semester: currentPeriod.semester,
        schoolYear: currentPeriod.schoolYear,
        ratingPeriod: currentPeriod.ratingPeriod
      });
      
      await evaluation.save();
      
      // Update period statistics
      currentPeriod.totalEvaluations += 1;
      await currentPeriod.save();
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: `Create Scholar Evaluation for ${evaluationData.scholarName || 'Scholar'}`,
        module: 'Evaluation'
      });

      res.status(201).json({
        success: true,
        message: 'Evaluation created successfully',
        evaluation
      });
    } catch (error) {
      console.error('Error creating evaluation:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Update evaluation (OAS Staff/Admin only - Department heads cannot update after submission)
  async updateEvaluation(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const evaluation = await ScholarEvaluation.findOne({
        _id: id,
        is_deleted: false
      });
      
      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Evaluation not found'
        });
      }
      
      // Only OAS staff and admins can update evaluations
      // Department heads cannot update after submission - their evaluations are read-only
      const userRole = req.user.role;
      if (userRole === 'department_head') {
        return res.status(403).json({
          success: false,
          message: 'Department heads cannot update evaluations after submission. Please contact OAS staff for any changes.'
        });
      }
      
      // Update fields
      Object.assign(evaluation, updateData);
      await evaluation.save();
      
      // Sync application status based on overall rating
      // 3.0 and above = approved (passed), below 3.0 = rejected (failed)
      if (evaluation.overallRating !== undefined && evaluation.scholar) {
        const evaluationPassed = parseFloat(evaluation.overallRating) >= 3.0;
        const newStatus = evaluationPassed ? 'approved' : 'rejected';
        
        const application = await ApplicationForm.findOne({ user: evaluation.scholar });
        if (application && application.status !== newStatus) {
          await ApplicationForm.findByIdAndUpdate(application._id, { status: newStatus });
          console.log(`✅ Application status synced to ${newStatus} for scholar evaluation (Rating: ${evaluation.overallRating})`);
        }
      }
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: `Update Scholar Evaluation for ${evaluation.scholarName || 'Scholar'}`,
        module: 'Evaluation'
      });

      res.json({
        success: true,
        message: 'Evaluation updated successfully',
        evaluation
      });
    } catch (error) {
      console.error('Error updating evaluation:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  // Get evaluations by department head
  async getMyEvaluations(req, res) {
    try {
      const { semester, schoolYear } = req.query;
      
      const query = {
        evaluatedBy: req.user.id,
        is_deleted: false
      };
      
      if (semester) query.semester = semester;
      if (schoolYear) query.schoolYear = schoolYear;
      
      const evaluations = await ScholarEvaluation.find(query)
        .populate('scholar', 'name email idNumber')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        evaluations
      });
    } catch (error) {
      console.error('Error getting evaluations:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Get evaluation by ID
  async getEvaluationById(req, res) {
    try {
      const { id } = req.params;
      
      const evaluation = await ScholarEvaluation.findOne({
        _id: id,
        is_deleted: false
      })
        .populate('scholar', 'name email idNumber')
        .populate('evaluatedBy', 'name email');
      
      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Evaluation not found'
        });
      }
      
      res.json({
        success: true,
        evaluation
      });
    } catch (error) {
      console.error('Error getting evaluation:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Get evaluations for a specific scholar (by scholar ID)
  async getEvaluationsForScholar(req, res) {
    try {
      const { scholarId } = req.params;
      
      const evaluations = await ScholarEvaluation.find({
        scholar: scholarId,
        is_deleted: false
      })
        .populate('scholar', 'name email idNumber')
        .populate('evaluatedBy', 'name email')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        evaluations,
        count: evaluations.length
      });
    } catch (error) {
      console.error('Error getting evaluations for scholar:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // ==================== ADMIN VIEWS ====================
  
  // Get all evaluations (Admin only)
  async getAllEvaluations(req, res) {
    try {
      const { semester, schoolYear, department } = req.query;
      
      const query = { is_deleted: false };
      
      if (semester) query.semester = semester;
      if (schoolYear) query.schoolYear = schoolYear;
      if (department) query.department = department;
      
      const evaluations = await ScholarEvaluation.find(query)
        .populate('scholar', 'name email idNumber')
        .populate('evaluatedBy', 'name email')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        evaluations,
        count: evaluations.length
      });
    } catch (error) {
      console.error('Error getting all evaluations:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Get evaluation statistics (Admin only)
  async getEvaluationStatistics(req, res) {
    try {
      const { semester, schoolYear } = req.query;
      
      const query = { is_deleted: false };
      if (semester) query.semester = semester;
      if (schoolYear) query.schoolYear = schoolYear;
      
      const evaluations = await ScholarEvaluation.find(query);
      
      const stats = {
        total: evaluations.length,
        byInterpretation: {
          'Very Good': evaluations.filter(e => e.interpretation === 'Very Good').length,
          'Good': evaluations.filter(e => e.interpretation === 'Good').length,
          'Average': evaluations.filter(e => e.interpretation === 'Average').length,
          'Poor': evaluations.filter(e => e.interpretation === 'Poor').length,
          'Very Poor': evaluations.filter(e => e.interpretation === 'Very Poor').length
        },
        byDepartment: {},
        averageRating: evaluations.length > 0
          ? evaluations.reduce((sum, e) => sum + e.overallRating, 0) / evaluations.length
          : 0
      };
      
      // Group by department
      evaluations.forEach(e => {
        if (!stats.byDepartment[e.department]) {
          stats.byDepartment[e.department] = 0;
        }
        stats.byDepartment[e.department]++;
      });
      
      res.json({
        success: true,
        statistics: stats
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Delete evaluation (soft delete) - OAS Staff/Admin only
  async deleteEvaluation(req, res) {
    try {
      const { id } = req.params;
      
      // Only OAS staff and admins can delete evaluations
      const userRole = req.user.role;
      if (userRole === 'department_head') {
        return res.status(403).json({
          success: false,
          message: 'Department heads cannot delete evaluations. Please contact OAS staff.'
        });
      }
      
      const evaluation = await ScholarEvaluation.findById(id);
      
      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Evaluation not found'
        });
      }
      
      evaluation.is_deleted = true;
      evaluation.deleted_at = new Date();
      await evaluation.save();
      
      // Log audit
      await AuditLogService.createLog({
        userId: req.user.id,
        action: `Delete Scholar Evaluation for ${evaluation.scholarName || 'Scholar'}`,
        module: 'Evaluation'
      });

      res.json({
        success: true,
        message: 'Evaluation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  // Get applicants ready for evaluation (for evaluation management page)
  async getApplicantsReadyForEvaluation(req, res) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Find applications with status 'approved' (ready for evaluation)
      const query = {
        status: 'approved',
        is_deleted: { $ne: true }
      };
      
      // Add search filter if provided
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { idNumber: { $regex: search, $options: 'i' } }
        ];
      }
      
      const total = await ApplicationForm.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));
      
      const applications = await ApplicationForm.find(query)
        .populate({
          path: 'user',
          select: 'name idNumber email course department',
          populate: [
            {
              path: 'course',
              select: 'courseId name departmentId',
              populate: {
                path: 'departmentId',
                select: 'departmentCode name'
              }
            },
            {
              path: 'department',
              select: 'departmentCode name'
            }
          ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      // Get user IDs to check for existing evaluations
      const userIds = applications.map(app => app.user?._id).filter(Boolean);
      
      const evaluations = await ScholarEvaluation.find({
        scholar: { $in: userIds },
        is_deleted: false
      }).select('scholar overallRating interpretation status createdAt updatedAt evaluatedBy evaluatorPosition attendanceAndPunctuality qualityOfWorkOutput quantityOfWorkOutput personalQualities timekeepingRecord supervisorRemarks nasRemarks semester schoolYear')
        .populate('evaluatedBy', 'name email department');
      
      const evaluationMap = new Map();
      evaluations.forEach(eval => {
        evaluationMap.set(eval.scholar.toString(), eval);
      });
      
      // Transform applicants data
      const applicants = applications.map(app => {
        const userId = app.user?._id?.toString();
        const evaluation = userId ? evaluationMap.get(userId) : null;
        
        // Get department from user's course or user's department field
        const department = app.user?.course?.departmentId?.name || 
                          app.user?.department?.name || 
                          app.user?.course?.departmentId?.departmentCode ||
                          app.user?.department?.departmentCode ||
                          'N/A';
        
        const departmentCode = app.user?.course?.departmentId?.departmentCode || 
                              app.user?.department?.departmentCode || 
                              '';
        
        return {
          _id: userId,
          applicationId: app._id,
          scholarId: userId,
          idNumber: app.user?.idNumber || app.idNumber,
          name: `${app.firstName} ${app.lastName}`.trim(),
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.user?.email || app.emailAddress,
          course: app.programOfStudyAndYear || app.user?.course?.name || 'N/A',
          yearLevel: app.yearLevel || 'N/A',
          department: department,
          departmentCode: departmentCode,
          applicationStatus: app.status,
          interviewsFinishedAt: app.interviewsFinishedAt,
          hasEvaluation: !!evaluation,
          evaluationStatus: evaluation?.status || null,
          finalDecision: evaluation?.finalDecision || null,
          evaluation: evaluation ? {
            _id: evaluation._id,
            overallRating: evaluation.overallRating,
            interpretation: evaluation.interpretation,
            status: evaluation.status,
            finalDecision: evaluation.finalDecision,
            evaluatedBy: evaluation.evaluatedBy,
            evaluatorDepartment: evaluation.evaluatedBy?.department,
            createdAt: evaluation.createdAt,
            updatedAt: evaluation.updatedAt,
            evaluatorPosition: evaluation.evaluatorPosition,
            attendanceAndPunctuality: evaluation.attendanceAndPunctuality,
            qualityOfWorkOutput: evaluation.qualityOfWorkOutput,
            quantityOfWorkOutput: evaluation.quantityOfWorkOutput,
            personalQualities: evaluation.personalQualities,
            timekeepingRecord: evaluation.timekeepingRecord,
            supervisorRemarks: evaluation.supervisorRemarks,
            nasRemarks: evaluation.nasRemarks,
            semester: evaluation.semester,
            schoolYear: evaluation.schoolYear
          } : undefined
        };
      });
      
      const summary = {
        totalReadyForEvaluation: total,
        evaluated: applicants.filter(a => a.hasEvaluation).length,
        pending: applicants.filter(a => !a.hasEvaluation).length
      };
      
      res.json({
        success: true,
        applicants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        summary
      });
    } catch (error) {
      console.error('Error getting applicants ready for evaluation:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = ScholarEvaluationController;
