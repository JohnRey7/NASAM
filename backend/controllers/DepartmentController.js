const DepartmentService = require('../services/DepartmentService');

// Create a new department
async function createDepartment(req, res) {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    
    const { departmentCode, name } = req.body;
    const department = await DepartmentService.createDepartment({ departmentCode, name });
    
    res.status(201).json(department);
  } catch (error) {
    console.error('Error in createDepartment:', error);
    res.status(400).json({ message: error.message });
  }
}

// Get all departments
async function getAllDepartments(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await DepartmentService.getAllDepartments({ page, limit });
    
    res.status(200).json({
      departments: result.departments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    res.status(400).json({ message: error.message });
  }
}

// Get department by ID
async function getDepartmentById(req, res) {
  try {
    const { id } = req.params;
    const department = await DepartmentService.getDepartmentById(id);
    
    res.status(200).json(department);
  } catch (error) {
    console.error('Error in getDepartmentById:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Get department by code
async function getDepartmentByCode(req, res) {
  try {
    const { departmentCode } = req.params;
    const department = await DepartmentService.getDepartmentByCode(departmentCode);
    
    res.status(200).json(department);
  } catch (error) {
    console.error('Error in getDepartmentByCode:', error);
    res.status(404).json({ message: error.message });
  }
}

// Update department
async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { departmentCode, name } = req.body;
    
    const department = await DepartmentService.updateDepartment(id, { departmentCode, name });
    
    res.status(200).json(department);
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Delete department
async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    const result = await DepartmentService.deleteDepartment(id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    res.status(error.message.includes('Invalid') ? 400 : 
               error.message.includes('Cannot delete') ? 409 : 404)
       .json({ message: error.message });
  }
}

// Get departments with user counts
async function getDepartmentsWithUserCounts(req, res) {
  try {
    const departments = await DepartmentService.getDepartmentsWithUserCounts();
    
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error in getDepartmentsWithUserCounts:', error);
    res.status(500).json({ message: 'Failed to get departments with user counts' });
  }
}

// Search departments
async function searchDepartments(req, res) {
  try {
    const { q: searchTerm } = req.query;
    const departments = await DepartmentService.searchDepartments(searchTerm);
    
    res.status(200).json(departments);
  } catch (error) {
    console.error('Error in searchDepartments:', error);
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  updateDepartment,
  deleteDepartment,
  getDepartmentsWithUserCounts,
  searchDepartments
};