const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

// Create a new evaluation (exclude timeKeepingRecord)
async function createEvaluation(req, res) {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
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
    } = req.body;

    // Validate evaluateeUser
    if (!evaluateeUser || !mongoose.Types.ObjectId.isValid(evaluateeUser)) {
      return res.status(400).json({ message: 'Valid evaluateeUser ID is required' });
    }
    const userExists = await User.findById(evaluateeUser);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has a completed interview
    const Interview = require('../models/Interview');
    const ApplicationForm = require('../models/ApplicationForm');
    
    const application = await ApplicationForm.findOne({ user: evaluateeUser });
    if (!application) {
      return res.status(404).json({ message: 'No application found for this user' });
    }
    
    const interview = await Interview.findOne({ applicationId: application._id });
    if (!interview) {
      return res.status(400).json({ message: 'No interview found for this applicant. Interview must be completed before evaluation.' });
    }
    
    // Check if interview is completed (has both start and end time and end time is in the past)
    const now = new Date();
    if (!interview.endTime || interview.endTime > now) {
      return res.status(400).json({ message: 'Interview must be completed before evaluation can be created.' });
    }

    // Validate required nested fields
    if (!attendanceAndPunctuality || !qualityOfWorkOutput || !quantityOfWorkOutput || !attitudeAndWorkBehavior || overallRating === undefined) {
      return res.status(400).json({ message: 'All required fields must be provided' });
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
    res.status(201).json(populatedEvaluation);
  } catch (error) {
    console.error('Error in createEvaluation:', error);
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Get all evaluations (paginated, with name search)
async function getAllEvaluations(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ message: 'Invalid page number' });
    }
    if (isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ message: 'Invalid limit' });
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

    res.status(200).json({
      data: evaluations,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error in getAllEvaluations:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get an evaluation by ID
async function getEvaluationById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid evaluation ID' });
    }

    const evaluation = await Evaluation.findById(id)
      .populate('evaluateeUser', 'name email');
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in getEvaluationById:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Update an evaluation (exclude timeKeepingRecord)
async function updateEvaluation(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid evaluation ID' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    const {
      attendanceAndPunctuality,
      qualityOfWorkOutput,
      quantityOfWorkOutput,
      attitudeAndWorkBehavior,
      remarksAndRecommendationByImmediateSupervisor,
      remarksCommentsByTheNAS,
      overallRating
    } = req.body;

    // Find evaluation
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
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
      .populate('evaluateeUser', 'name email');
    res.status(200).json(populatedEvaluation);
  } catch (error) {
    console.error('Error in updateEvaluation:', error);
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Delete an evaluation
async function deleteEvaluation(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid evaluation ID' });
    }

    const evaluation = await Evaluation.findByIdAndDelete(id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    res.status(200).json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Error in deleteEvaluation:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Update timeKeepingRecord
async function updateTimeKeepingRecord(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid evaluation ID' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    const timeKeepingRecord = req.body;

    // Validate timeKeepingRecord fields
    const fields = ['excusedAbsences', 'unexcusedAbsences', 'lateGreaterThanTenMinutes', 'lateGreaterThanOneHour', 'failureToPunch', 'underTime'];
    for (const field of fields) {
      if (timeKeepingRecord[field] !== undefined) {
        if (!Number.isInteger(timeKeepingRecord[field]) || timeKeepingRecord[field] < 0) {
          return res.status(400).json({ message: `${field} must be a non-negative integer` });
        }
      }
    }

    // Find evaluation
    const evaluation = await Evaluation.findById(id);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Update timeKeepingRecord
    evaluation.timeKeepingRecord = { ...evaluation.timeKeepingRecord, ...timeKeepingRecord };
    await evaluation.save();

    // Populate and return
    const populatedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('evaluateeUser', 'name email');
    res.status(200).json(populatedEvaluation);
  } catch (error) {
    console.error('Error in updateTimeKeepingRecord:', error);
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Get timeKeepingRecord
async function getTimeKeepingRecord(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid evaluation ID' });
    }

    const evaluation = await Evaluation.findById(id).select('timeKeepingRecord');
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    res.status(200).json({ timeKeepingRecord: evaluation.timeKeepingRecord });
  } catch (error) {
    console.error('Error in getTimeKeepingRecord:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

module.exports = {
  createEvaluation,
  getAllEvaluations,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
  updateTimeKeepingRecord,
  getTimeKeepingRecord
};