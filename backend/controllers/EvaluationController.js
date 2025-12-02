const EvaluationService = require('../services/EvaluationService');

// Create a new evaluation for a user by idNumber
async function createEvaluation(req, res) {
  try {
    const { idNumber } = req.params;
    const evaluationData = { ...req.body, idNumber };
    const evaluation = await EvaluationService.createEvaluation(evaluationData);
    
    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Error in createEvaluation:', error);
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
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

// Get evaluations by user's idNumber (returns array)
async function getEvaluationsByIdNumber(req, res) {
  try {
    const { idNumber } = req.params;
    const evaluations = await EvaluationService.getEvaluationsByIdNumber(idNumber);
    
    res.status(200).json(evaluations);
  } catch (error) {
    console.error('Error in getEvaluationsByIdNumber:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get an evaluation by evaluationId
async function getEvaluationById(req, res) {
  try {
    const { evaluationId } = req.params;
    const evaluation = await EvaluationService.getEvaluationById(evaluationId);
    
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

// Update an evaluation by evaluationId
async function updateEvaluation(req, res) {
  try {
    const { evaluationId } = req.params;
    const evaluation = await EvaluationService.updateEvaluation(evaluationId, req.body);
    
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

// Delete an evaluation by evaluationId
async function deleteEvaluation(req, res) {
  try {
    const { evaluationId } = req.params;
    const result = await EvaluationService.deleteEvaluation(evaluationId);
    
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

// Update timeKeepingRecord by evaluationId
async function updateTimeKeepingRecord(req, res) {
  try {
    const { evaluationId } = req.params;
    const evaluation = await EvaluationService.updateTimeKeepingRecord(evaluationId, req.body);
    
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

// Get timeKeepingRecord by evaluationId
async function getTimeKeepingRecord(req, res) {
  try {
    const { evaluationId } = req.params;
    const result = await EvaluationService.getTimeKeepingRecord(evaluationId);
    
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

// Soft delete an evaluation by evaluationId
async function softDeleteEvaluation(req, res) {
  try {
    const { evaluationId } = req.params;
    const result = await EvaluationService.softDeleteEvaluation(evaluationId);
    
    res.json(result);
  } catch (error) {
    console.error('Error in softDeleteEvaluation:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Restore a soft-deleted evaluation by evaluationId
async function restoreEvaluation(req, res) {
  try {
    const { evaluationId } = req.params;
    const result = await EvaluationService.restoreEvaluation(evaluationId);
    
    res.json(result);
  } catch (error) {
    console.error('Error in restoreEvaluation:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Permanently delete an evaluation by evaluationId
async function permanentDeleteEvaluation(req, res) {
  try {
    const { evaluationId } = req.params;
    const result = await EvaluationService.permanentDeleteEvaluation(evaluationId);
    
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

// Get my evaluation status (last evaluation for authenticated user)
async function getMyEvaluationStatus(req, res) {
  try {
    const userId = req.user.id;
    const result = await EvaluationService.getEvaluationStatusByUserId(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getMyEvaluationStatus:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Get all evaluations for authenticated user
async function getMyEvaluations(req, res) {
  try {
    const userId = req.user.id;
    const evaluations = await EvaluationService.getEvaluationsByUserId(userId);
    
    res.status(200).json(evaluations);
  } catch (error) {
    console.error('Error in getMyEvaluations:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get last evaluation for authenticated user
async function getMyLastEvaluation(req, res) {
  try {
    const userId = req.user.id;
    const evaluation = await EvaluationService.getLastEvaluationByUserId(userId);
    
    if (!evaluation) {
      return res.status(404).json({ message: 'No evaluation found' });
    }
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in getMyLastEvaluation:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get available semesters for a user by idNumber
async function getAvailableSemesters(req, res) {
  try {
    const { idNumber } = req.params;
    const { schoolYear } = req.query; // Optional query param
    const result = await EvaluationService.getAvailableSemestersForUser(idNumber, schoolYear);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAvailableSemesters:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createEvaluation,
  getAllEvaluations,
  getEvaluationsByIdNumber,
  getEvaluationById,
  updateEvaluation,
  deleteEvaluation,
  updateTimeKeepingRecord,
  getTimeKeepingRecord,
  softDeleteEvaluation,
  restoreEvaluation,
  permanentDeleteEvaluation,
  getSoftDeletedEvaluations,
  getMyEvaluationStatus,
  getMyEvaluations,
  getMyLastEvaluation,
  getAvailableSemesters
};