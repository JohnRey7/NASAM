const EvaluationService = require('../services/EvaluationService');

// Create a new evaluation (exclude timeKeepingRecord)
async function createEvaluation(req, res) {
  try {
    const evaluation = await EvaluationService.createEvaluation(req.body);
    
    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Error in createEvaluation:', error);
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('Interview must be completed')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Get all evaluations (paginated, with name search)
async function getAllEvaluations(req, res) {
  try {
    const result = await EvaluationService.getAllEvaluations(req.query);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAllEvaluations:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get an evaluation by ID
async function getEvaluationById(req, res) {
  try {
    const { idNumber } = req.params;
    const evaluation = await EvaluationService.getEvaluationById(idNumber);
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in getEvaluationById:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Update an evaluation (exclude timeKeepingRecord)
async function updateEvaluation(req, res) {
  try {
    const { idNumber } = req.params;
    const evaluation = await EvaluationService.updateEvaluation(idNumber, req.body);
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in updateEvaluation:', error);
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Delete an evaluation
async function deleteEvaluation(req, res) {
  try {
    const { idNumber } = req.params;
    const result = await EvaluationService.deleteEvaluation(idNumber);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteEvaluation:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Update timeKeepingRecord
async function updateTimeKeepingRecord(req, res) {
  try {
    const { idNumber } = req.params;
    const evaluation = await EvaluationService.updateTimeKeepingRecord(idNumber, req.body);
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in updateTimeKeepingRecord:', error);
    if (error.message.includes('Invalid') || error.message.includes('required') || error.message.includes('must be')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Get timeKeepingRecord
async function getTimeKeepingRecord(req, res) {
  try {
    const { idNumber } = req.params;
    const result = await EvaluationService.getTimeKeepingRecord(idNumber);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getTimeKeepingRecord:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Soft delete an evaluation
async function softDeleteEvaluation(req, res) {
  try {
    const { idNumber } = req.params;
    const result = await EvaluationService.softDeleteEvaluation(idNumber);
    
    res.json(result);
  } catch (error) {
    console.error('Error in softDeleteEvaluation:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Restore a soft-deleted evaluation
async function restoreEvaluation(req, res) {
  try {
    const { idNumber } = req.params;
    const result = await EvaluationService.restoreEvaluation(idNumber);
    
    res.json(result);
  } catch (error) {
    console.error('Error in restoreEvaluation:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Permanently delete an evaluation
async function permanentDeleteEvaluation(req, res) {
  try {
    const { idNumber } = req.params;
    const result = await EvaluationService.permanentDeleteEvaluation(idNumber);
    
    res.json(result);
  } catch (error) {
    console.error('Error in permanentDeleteEvaluation:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Get soft-deleted evaluations
async function getSoftDeletedEvaluations(req, res) {
  try {
    const result = await EvaluationService.getSoftDeletedEvaluations(req.query);
    
    res.json(result);
  } catch (error) {
    console.error('Error in getSoftDeletedEvaluations:', error);
    res.status(500).json({ message: 'Server error' });
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
  softDeleteEvaluation,
  restoreEvaluation,
  permanentDeleteEvaluation,
  getSoftDeletedEvaluations
};