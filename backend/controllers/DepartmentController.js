const mongoose = require('mongoose');
const Department = require('../models/Department');

// Create a new department
async function createDepartment(req, res) {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    const { departmentCode, name } = req.body;

    // Validate required fields
    if (!departmentCode || !name) {
      return res.status(400).json({ message: 'Department code and name are required' });
    }

    // Check for existing departmentCode
    const existingDepartment = await Department.findOne({ departmentCode });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department code already exists' });
    }

    // Create department
    const department = new Department({ departmentCode, name });
    await department.save();

    res.status(201).json(department);
  } catch (error) {
    console.error('Error in createDepartment:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department code already exists' });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Get all departments (paginated, with search)
async function getAllDepartments(req, res) {
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
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { departmentCode: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    // Fetch departments
    const departments = await Department.find(query)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Department.countDocuments(query);

    res.status(200).json({
      data: departments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Get a department by departmentCode
async function getDepartmentByCode(req, res) {
  try {
    const { departmentCode } = req.params;

    // Validate departmentCode
    if (!departmentCode || !/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
      return res.status(400).json({ message: 'Invalid department code' });
    }

    const department = await Department.findOne({ departmentCode });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json(department);
  } catch (error) {
    console.error('Error in getDepartmentByCode:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

// Update a department by departmentCode
async function updateDepartment(req, res) {
  try {
    const { departmentCode } = req.params;

    // Validate departmentCode
    if (!departmentCode || !/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
      return res.status(400).json({ message: 'Invalid department code' });
    }

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    const { departmentCode: newDepartmentCode, name } = req.body;

    // Find department
    const department = await Department.findOne({ departmentCode });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check for departmentCode conflict
    if (newDepartmentCode && newDepartmentCode !== department.departmentCode) {
      const existingDepartment = await Department.findOne({ departmentCode: newDepartmentCode });
      if (existingDepartment) {
        return res.status(400).json({ message: 'Department code already exists' });
      }
      department.departmentCode = newDepartmentCode;
    }

    // Update fields
    if (name) department.name = name;

    await department.save();

    res.status(200).json(department);
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department code already exists' });
    }
    res.status(400).json({ message: `Validation error: ${error.message}` });
  }
}

// Delete a department by departmentCode
async function deleteDepartment(req, res) {
  try {
    const { departmentCode } = req.params;

    // Validate departmentCode
    if (!departmentCode || !/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
      return res.status(400).json({ message: 'Invalid department code' });
    }

    const department = await Department.findOneAndDelete({ departmentCode });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
}

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentByCode,
  updateDepartment,
  deleteDepartment
};