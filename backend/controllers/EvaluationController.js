const EvaluationService = require('../services/EvaluationService');

// Create a new evaluation (exclude timeKeepingRecord)
async function createEvaluation(req, res) {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    
    const evaluationData = req.body;
    const evaluation = await EvaluationService.createEvaluation(evaluationData);
    
    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Error in createEvaluation:', error);
    res.status(400).json({ message: error.message });
  }
}

// Get all evaluations (paginated, with name search)
async function getAllEvaluations(req, res) {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const result = await EvaluationService.getAllEvaluations({ page, limit, search });

    res.status(200).json({
      evaluations: result.evaluations,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllEvaluations:', error);
    res.status(400).json({ message: error.message });
  }
}

// Get an evaluation by ID
async function getEvaluationById(req, res) {
  try {
    const { id } = req.params;
    
    const evaluation = await EvaluationService.getEvaluationById(id);
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in getEvaluationById:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Update an evaluation (exclude timeKeepingRecord)
async function updateEvaluation(req, res) {
  try {
    const { id } = req.params;
    const evaluationData = req.body;
    
    const evaluation = await EvaluationService.updateEvaluation(id, evaluationData);
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in updateEvaluation:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Delete an evaluation
async function deleteEvaluation(req, res) {
  try {
    const { id } = req.params;
    
    const result = await EvaluationService.deleteEvaluation(id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteEvaluation:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Update timeKeepingRecord
async function updateTimeKeepingRecord(req, res) {
  try {
    const { id } = req.params;
    const { timeKeepingRecord } = req.body;
    
    const evaluation = await EvaluationService.updateTimeKeepingRecord(id, timeKeepingRecord);
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in updateTimeKeepingRecord:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Get timeKeepingRecord
async function getTimeKeepingRecord(req, res) {
  try {
    const { id } = req.params;
    
    const result = await EvaluationService.getTimeKeepingRecord(id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getTimeKeepingRecord:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Get evaluations by user ID
async function getEvaluationsByUserId(req, res) {
  try {
    const { userId } = req.params;
    
    const evaluations = await EvaluationService.getEvaluationsByUserId(userId);
    
    res.status(200).json(evaluations);
  } catch (error) {
    console.error('Error in getEvaluationsByUserId:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Get evaluation statistics
async function getEvaluationStatistics(req, res) {
  try {
    const statistics = await EvaluationService.getEvaluationStatistics();
    
    res.status(200).json(statistics);
  } catch (error) {
    console.error('Error in getEvaluationStatistics:', error);
    res.status(500).json({ message: 'Failed to get evaluation statistics' });
  }
}

module.exports = {
  createEvaluation,
  getAllEvaluations,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
  updateTimeKeepingRecord,
  getTimeKeepingRecord,
  getEvaluationsByUserId,
  getEvaluationStatistics
};