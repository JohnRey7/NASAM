const ScholarEvaluation = require('../models/ScholarEvaluation');
const EvaluationPeriod = require('../models/EvaluationPeriod');
const User = require('../models/User');
const NotificationService = require('../services/NotificationService');
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
  
  // Update evaluation
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
      
      // Check if user is the evaluator
      if (evaluation.evaluatedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own evaluations'
        });
      }
      
      // Update fields
      Object.assign(evaluation, updateData);
      await evaluation.save();
      
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
  
  // Delete evaluation (soft delete)
  async deleteEvaluation(req, res) {
    try {
      const { id } = req.params;
      
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
      
      res.json({
        success: true,
        message: 'Evaluation deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = ScholarEvaluationController;
