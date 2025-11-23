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
      return res.status(400).json({ message: `Validation error: ${error.message}` });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Get all departments (paginated, with search)
async function getAllDepartments(req, res) {
  try {
    console.log('DepartmentController: Getting all departments with query:', req.query);
    const result = await DepartmentService.getAllDepartments(req.query);
    console.log('DepartmentController: Service returned:', result);
    console.log('DepartmentController: Number of departments:', result?.data?.length || 0);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
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

// Soft delete a department
async function softDeleteDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.softDeleteDepartment(departmentCode);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in softDeleteDepartment:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Restore a soft-deleted department
async function restoreDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.restoreDepartment(departmentCode);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in restoreDepartment:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Permanently delete a department
async function permanentDeleteDepartment(req, res) {
  try {
    const { departmentCode } = req.params;
    const result = await DepartmentService.permanentDeleteDepartment(departmentCode);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in permanentDeleteDepartment:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get soft-deleted departments
async function getSoftDeletedDepartments(req, res) {
  try {
    const result = await DepartmentService.getSoftDeletedDepartments(req.query);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getSoftDeletedDepartments:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Set department head by user ID (null to remove)
async function setDepartmentHeadById(req, res) {
  try {
    const { departmentCode } = req.params;
    const { userId } = req.body;
    
    // userId can be null to remove department head
    const result = await DepartmentService.setDepartmentHeadById(departmentCode, userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in setDepartmentHeadById:', error);
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Set department head by idNumber (null to remove)
async function setDepartmentHeadByIdNumber(req, res) {
  try {
    const { departmentCode } = req.params;
    const { idNumber } = req.body;

    // idNumber can be null to remove department head
    const result = await DepartmentService.setDepartmentHeadByIdNumber(departmentCode, idNumber);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in setDepartmentHeadByIdNumber:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(400).json({ message: `Error: ${error.message}` });
  }
}

// Assign applicant to department
async function assignApplicantToDepartment(req, res) {
  try {
    const { userId, departmentCode } = req.body;
    
    if (!userId || !departmentCode) {
      return res.status(400).json({ message: 'userId and departmentCode are required' });
    }

    const result = await DepartmentService.assignApplicantToDepartment(userId, departmentCode);
    
    res.status(200).json({
      message: 'Applicant assigned to department successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in assignApplicantToDepartment:', error);
    if (error.message.includes('not found') || error.message.includes('Invalid')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
}

// Get applicants assigned to department head's department
async function getApplicantsForDepartmentHead(req, res) {
  try {
    const userId = req.user.id; // From authenticate middleware
    console.log('🔍 Getting applicants for department head:', userId);
    
    const result = await DepartmentService.getApplicantsForDepartmentHead(userId);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getApplicantsForDepartmentHead:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('not assigned')) {
      return res.status(400).json({ message: error.message });
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
  softDeleteDepartment,
  restoreDepartment,
  permanentDeleteDepartment,
  getSoftDeletedDepartments,
  setDepartmentHeadById,
  setDepartmentHeadByIdNumber,
  assignApplicantToDepartment,
  getApplicantsForDepartmentHead
};