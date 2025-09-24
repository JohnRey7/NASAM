const DepartmentService = require('../services/DepartmentService');

// Create a new department
async function createDepartment(req, res) {
  try {
    const result = await DepartmentService.createDepartment(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createDepartment:', error);
    const statusCode = error.message.includes('already exists') ? 400 :
                      error.message.includes('required') ? 400 :
                      error.message.includes('Validation error') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get all departments (paginated, with search)
async function getAllDepartments(req, res) {
  try {
    const result = await DepartmentService.getAllDepartments(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get a department by departmentCode
async function getDepartmentByCode(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.getDepartmentByCode(departmentCode);
    res.json(result);
  } catch (error) {
    console.error('Error in getDepartmentByCode:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Update a department by departmentCode
async function updateDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.updateDepartment(departmentCode, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Delete a department by departmentCode
async function deleteDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.deleteDepartment(departmentCode);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('Cannot delete') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get users by department code
async function getUsersByDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.getUsersByDepartment(departmentCode, req.query);
    res.json(result);
  } catch (error) {
    console.error('Error in getUsersByDepartment:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get statistics for a department
async function getDepartmentStatistics(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.getDepartmentStatistics(departmentCode);
    res.json(result);
  } catch (error) {
    console.error('Error in getDepartmentStatistics:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Assign department head
async function assignDepartmentHead(req, res) {
  try {
    const { departmentCode } = req.params;
    const { userId } = req.body;
    const result = await DepartmentService.assignDepartmentHead(departmentCode, userId);
    res.json(result);
  } catch (error) {
    console.error('Error in assignDepartmentHead:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Remove department head
async function removeDepartmentHead(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.removeDepartmentHead(departmentCode);
    res.json(result);
  } catch (error) {
    console.error('Error in removeDepartmentHead:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get applicants for department head
async function getApplicantsForDepartmentHead(req, res) {
  try {
    // This is a placeholder - implement the actual logic as needed
    res.status(501).json({ message: 'Get applicants for department head functionality not yet implemented' });
  } catch (error) {
    console.error('Error in getApplicantsForDepartmentHead:', error);
    res.status(500).json({ message: error.message });
  }
}

// Assign applicant to department
async function assignApplicantToDepartment(req, res) {
  try {
    // This is a placeholder - implement the actual logic as needed
    res.status(501).json({ message: 'Assign applicant to department functionality not yet implemented' });
  } catch (error) {
    console.error('Error in assignApplicantToDepartment:', error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentByCode,
  updateDepartment,
  deleteDepartment,
  getUsersByDepartment,
  getDepartmentStatistics,
  assignDepartmentHead,
  removeDepartmentHead,
  getApplicantsForDepartmentHead,
  assignApplicantToDepartment
};
