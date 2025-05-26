const mongoose = require('mongoose');
const Panelist = require('../models/Panelist');
const User = require('../models/User');

// Create a new panelist
async function createPanelist(req, res) {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    const { evaluatorUser, evaluation } = req.body;

    // Validate evaluatorUser
    if (!evaluatorUser || !mongoose.Types.ObjectId.isValid(evaluatorUser)) {
      return res.status(400).json({ message: 'Valid evaluatorUser ID is required' });
    }
    const userExists = await User.findById(evaluatorUser);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate evaluation if provided
    if (evaluation && !mongoose.Types.ObjectId.isValid(evaluation)) {
      return res.status(400).json({ message: 'Invalid evaluation ID' });
    }
    if (evaluation) {
      const evaluationExists = await Evaluation.findById(evaluation);
      if (!evaluationExists) {
        return res.status(404).json({ message: 'Evaluation not found' });
      }
    }

    // Create panelist
    const panelist = new Panelist({
      evaluatorUser,
      evaluation: evaluation || null
    });
    await panelist.save();

    // Populate and return (exclude evaluation)
    const populatedPanelist = await Panelist.findById(panelist._id)
      .populate('evaluatorUser', 'name email')
      .select('-evaluation');
    res.status(201).json(populatedPanelist);
  } catch (error) {
    console.error('Error in createPanelist:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get all panelists (paginated, with name search)
async function getAllPanelists(req, res) {
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
      query.evaluatorUser = { $in: userIds };
    }

    // Fetch panelists
    const panelists = await Panelist.find(query)
      .populate('evaluatorUser', 'name email')
      .select('-evaluation')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Panelist.countDocuments(query);

    res.status(200).json({
      data: panelists,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error in getAllPanelists:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get a panelist by ID
async function getPanelistById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid panelist ID' });
    }

    const panelist = await Panelist.findById(id)
      .populate('evaluatorUser', 'name email')
      .select('-evaluation');
    if (!panelist) {
      return res.status(404).json({ message: 'Panelist not found' });
    }

    res.status(200).json(panelist);
  } catch (error) {
    console.error('Error in getPanelistById:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Update a panelist (only evaluatorUser)
async function updatePanelist(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid panelist ID' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    const { evaluatorUser } = req.body;

    // Validate evaluatorUser
    if (!evaluatorUser || !mongoose.Types.ObjectId.isValid(evaluatorUser)) {
      return res.status(400).json({ message: 'Valid evaluatorUser ID is required' });
    }
    const userExists = await User.findById(evaluatorUser);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and update panelist
    const panelist = await Panelist.findById(id);
    if (!panelist) {
      return res.status(404).json({ message: 'Panelist not found' });
    }

    panelist.evaluatorUser = evaluatorUser;
    await panelist.save();

    // Populate and return (exclude evaluation)
    const populatedPanelist = await Panelist.findById(panelist._id)
      .populate('evaluatorUser', 'name email')
      .select('-evaluation');
    res.status(200).json(populatedPanelist);
  } catch (error) {
    console.error('Error in updatePanelist:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Delete a panelist
async function deletePanelist(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid panelist ID' });
    }

    const panelist = await Panelist.findByIdAndDelete(id);
    if (!panelist) {
      return res.status(404).json({ message: 'Panelist not found' });
    }

    res.status(200).json({ message: 'Panelist deleted successfully' });
  } catch (error) {
    console.error('Error in deletePanelist:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

module.exports = {
  createPanelist,
  getAllPanelists,
  getPanelistById,
  updatePanelist,
  deletePanelist
};