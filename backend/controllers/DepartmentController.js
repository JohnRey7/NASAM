const DepartmentService = require('../services/DepartmentService');

// Create a new department
async function createDepartment(req, res) {
  try {
    const department = await DepartmentService.createDepartment(req.body);
    
    res.status(201).json(department);
  } catch (error) {
    console.error('Error in createDepartment:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Get all departments (paginated, with search)
async function getAllDepartments(req, res) {
  try {
    const result = await DepartmentService.getAllDepartments(req.query);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get a department by departmentCode
async function getDepartmentByCode(req, res) {
  try {
    const { departmentCode } = req.params;
    const department = await DepartmentService.getDepartmentByCode(departmentCode);
    
    res.status(200).json(department);
  } catch (error) {
    console.error('Error in getDepartmentByCode:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Update a department by departmentCode
async function updateDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const department = await DepartmentService.updateDepartment(departmentCode, req.body);
    
    res.status(200).json(department);
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already exists')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Delete a department by departmentCode
async function deleteDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.deleteDepartment(departmentCode);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get all applicants assigned to the logged-in department head's department
async function getApplicantsForDepartmentHead(req, res) {
  try {
    const applicants = await DepartmentService.getApplicantsForDepartmentHead(req.user);
    
    res.json(applicants);
  } catch (error) {
    console.error('Error in getApplicantsForDepartmentHead:', error);
    if (error.message.includes('not found') || error.message.includes('not assigned')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Assign a user (applicant) to a department
async function assignApplicantToDepartment(req, res) {
  try {
    const { userId, departmentCode } = req.body;
    const result = await DepartmentService.assignApplicantToDepartment(userId, departmentCode);
    
    res.json(result);
  } catch (error) {
    console.error('Error in assignApplicantToDepartment:', error);
    if (error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentByCode,
  updateDepartment,
  deleteDepartment,
  getApplicantsForDepartmentHead,
  assignApplicantToDepartment
};