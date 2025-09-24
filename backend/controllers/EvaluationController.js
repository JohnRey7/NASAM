const EvaluationService = require('../services/EvaluationService');

// Create a new evaluation (exclude timeKeepingRecord)
async function createEvaluation(req, res) {
  try {
    const result = await EvaluationService.createEvaluation(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createEvaluation:', error);
    const statusCode = error.message.includes('required') ? 400 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('must be completed') ? 400 :
                      error.message.includes('already exists') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get all evaluations (paginated, with search and filter options)
async function getAllEvaluations(req, res) {
  try {
    const result = await EvaluationService.getAllEvaluations(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error in getAllEvaluations:', error);
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get evaluation by ID
async function getEvaluationById(req, res) {
  try {
    const { id } = req.params;
    const result = await EvaluationService.getEvaluationById(id);
    res.json(result);
  } catch (error) {
    console.error('Error in getEvaluationById:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get evaluation by evaluatee user ID
async function getEvaluationByUserId(req, res) {
  try {
    const { userId } = req.params;
    const result = await EvaluationService.getEvaluationByUserId(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in getEvaluationByUserId:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Update evaluation by ID (exclude timeKeepingRecord)
async function updateEvaluationById(req, res) {
  try {
    const { id } = req.params;
    const result = await EvaluationService.updateEvaluationById(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in updateEvaluationById:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Update evaluation by evaluatee user ID (exclude timeKeepingRecord)
async function updateEvaluationByUserId(req, res) {
  try {
    const { userId } = req.params;
    const result = await EvaluationService.updateEvaluationByUserId(userId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in updateEvaluationByUserId:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Delete evaluation by ID
async function deleteEvaluationById(req, res) {
  try {
    const { id } = req.params;
    const result = await EvaluationService.deleteEvaluationById(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteEvaluationById:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Delete evaluation by evaluatee user ID
async function deleteEvaluationByUserId(req, res) {
  try {
    const { userId } = req.params;
    const result = await EvaluationService.deleteEvaluationByUserId(userId);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteEvaluationByUserId:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Add time record to evaluation
async function addTimeRecord(req, res) {
  try {
    const { id } = req.params;
    const result = await EvaluationService.addTimeRecord(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in addTimeRecord:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Update time record in evaluation
async function updateTimeRecord(req, res) {
  try {
    const { id, recordId } = req.params;
    const result = await EvaluationService.updateTimeRecord(id, recordId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in updateTimeRecord:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Delete time record from evaluation
async function deleteTimeRecord(req, res) {
  try {
    const { id, recordId } = req.params;
    const result = await EvaluationService.deleteTimeRecord(id, recordId);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteTimeRecord:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get timekeeping records for an evaluation
async function getTimeRecord(req, res) {
  try {
    const { id } = req.params;
    // This is a placeholder - implement the actual logic as needed
    res.status(501).json({ message: 'Get timekeeping record functionality not yet implemented' });
  } catch (error) {
    console.error('Error in getTimeRecord:', error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createEvaluation,
  getAllEvaluations,
  getEvaluationById,
  getEvaluationByUserId,
  updateEvaluationById,
  updateEvaluationByUserId,
  deleteEvaluationById,
  deleteEvaluationByUserId,
  addTimeRecord,
  updateTimeRecord,
  deleteTimeRecord,
  getTimeRecord
};
