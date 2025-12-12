const EvaluationService = require('../services/EvaluationService');
const AuditLogService = require('../services/AuditLogService');

// Create a new evaluation for a user by idNumber
async function createEvaluation(req, res) {
  try {
    const { idNumber } = req.params;
    const evaluationData = { ...req.body, idNumber };
    const evaluation = await EvaluationService.createEvaluation(evaluationData);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Create Evaluation',
      module: 'Evaluation'
    });
    
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

// Update an evaluation by evaluationId (OAS Staff/Admin only - Department heads cannot update)
async function updateEvaluation(req, res) {
  try {
    const { evaluationId } = req.params;
    
    // Restrict department heads from updating evaluations
    const userRole = req.user.role;
    if (userRole === 'department_head') {
      return res.status(403).json({ 
        message: 'Department heads cannot update evaluations after submission. Please contact OAS staff for any changes.' 
      });
    }
    
    const evaluation = await EvaluationService.updateEvaluation(evaluationId, req.body);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Update Evaluation',
      module: 'Evaluation'
    });
    
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

// Delete an evaluation by evaluationId (OAS Staff/Admin only - Department heads cannot delete)
async function deleteEvaluation(req, res) {
  try {
    const { evaluationId } = req.params;
    
    // Restrict department heads from deleting evaluations
    const userRole = req.user.role;
    if (userRole === 'department_head') {
      return res.status(403).json({ 
        message: 'Department heads cannot delete evaluations. Please contact OAS staff.' 
      });
    }
    
    const result = await EvaluationService.deleteEvaluation(evaluationId);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Delete Evaluation',
      module: 'Evaluation'
    });
    
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

// Update timeKeepingRecord by evaluationId (OAS Staff/Admin only - Department heads cannot update timekeeping)
async function updateTimeKeepingRecord(req, res) {
  try {
    const { evaluationId } = req.params;
    
    // Restrict department heads from updating timekeeping
    const userRole = req.user.role;
    if (userRole === 'department_head') {
      return res.status(403).json({ 
        message: 'Department heads cannot update timekeeping records. Only OAS staff can manage timekeeping.' 
      });
    }
    
    const evaluation = await EvaluationService.updateTimeKeepingRecord(evaluationId, req.body);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Update Timekeeping Record',
      module: 'Evaluation'
    });
    
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
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Soft Delete Evaluation',
      module: 'Evaluation'
    });
    
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
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Restore Evaluation',
      module: 'Evaluation'
    });
    
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

// Soft delete all evaluations for a specific period (Admin only - when evaluation period ends)
async function softDeleteEvaluationsByPeriod(req, res) {
  try {
    const { semester, schoolYear } = req.body;
    const result = await EvaluationService.softDeleteEvaluationsByPeriod(semester, schoolYear);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in softDeleteEvaluationsByPeriod:', error);
    if (error.message.includes('required') || error.message.includes('Valid')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Restore all evaluations for a specific period (Admin only)
async function restoreEvaluationsByPeriod(req, res) {
  try {
    const { semester, schoolYear } = req.body;
    const result = await EvaluationService.restoreEvaluationsByPeriod(semester, schoolYear);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in restoreEvaluationsByPeriod:', error);
    if (error.message.includes('required') || error.message.includes('Valid')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Admin-specific endpoints for user-based evaluation management

// GET evaluation for specific user (by userId - gets latest evaluation)
async function getEvaluationForUser(req, res) {
  try {
    const { userId } = req.params;
    
    const evaluation = await EvaluationService.getEvaluationByUserId(userId);
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in getEvaluationForUser:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// GET all evaluations with pagination (limit 50 per page) for admin
async function getAllEvaluationsForAdmin(req, res) {
  try {
    const { page = 1, limit = 50, search = '', includeDeleted = false } = req.query;
    
    // Force limit to max 50
    const maxLimit = Math.min(parseInt(limit), 50);
    
    const result = await EvaluationService.getAllEvaluations({
      page,
      limit: maxLimit,
      search,
      includeDeleted: includeDeleted === 'true'
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAllEvaluationsForAdmin:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// POST create evaluation for specific user (by userId)
async function createEvaluationForUser(req, res) {
  try {
    const { userId } = req.params;
    const evaluationData = { ...req.body, userId };
    
    const evaluation = await EvaluationService.createEvaluationByUserId(userId, evaluationData);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Create Evaluation for User',
      module: 'Evaluation'
    });
    
    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Error in createEvaluationForUser:', error);
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// PUT update evaluation for specific user (by userId - updates latest evaluation)
async function updateEvaluationForUser(req, res) {
  try {
    const { userId } = req.params;
    
    const evaluation = await EvaluationService.updateEvaluationByUserId(userId, req.body);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Update Evaluation for User',
      module: 'Evaluation'
    });
    
    res.status(200).json(evaluation);
  } catch (error) {
    console.error('Error in updateEvaluationForUser:', error);
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// DELETE soft delete evaluation for specific user (by userId - soft deletes latest evaluation)
async function softDeleteEvaluationForUser(req, res) {
  try {
    const { userId } = req.params;
    
    const result = await EvaluationService.softDeleteEvaluationByUserId(userId);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Soft Delete Evaluation for User',
      module: 'Evaluation'
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in softDeleteEvaluationForUser:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// DELETE permanent delete evaluation for specific user (by userId - permanently deletes latest evaluation)
async function permanentDeleteEvaluationForUser(req, res) {
  try {
    const { userId } = req.params;
    
    const result = await EvaluationService.permanentDeleteEvaluationByUserId(userId);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Permanent Delete Evaluation for User',
      module: 'Evaluation'
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in permanentDeleteEvaluationForUser:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// POST restore evaluation for specific user (by userId - restores latest soft-deleted evaluation)
async function restoreEvaluationForUser(req, res) {
  try {
    const { userId } = req.params;
    
    const result = await EvaluationService.restoreEvaluationByUserId(userId);
    
    // Log audit
    await AuditLogService.createLog({
      userId: req.user.id,
      action: 'Restore Evaluation for User',
      module: 'Evaluation'
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in restoreEvaluationForUser:', error);
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
  getAvailableSemesters,
  softDeleteEvaluationsByPeriod,
  restoreEvaluationsByPeriod,
  // Admin-specific user-based methods
  getAllEvaluationsForAdmin,
  getEvaluationForUser,
  createEvaluationForUser,
  updateEvaluationForUser,
  softDeleteEvaluationForUser,
  permanentDeleteEvaluationForUser,
  restoreEvaluationForUser
};