const mongoose = require('mongoose');
const Department = require('../models/Department');

// Create a new department
async function createDepartment(req, res) {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Request body is required' });
    }
    let { departmentCode, name } = req.body;

    departmentCode = departmentCode.toUpperCase();

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
    let { departmentCode } = req.params;

    departmentCode = departmentCode.toUpperCase();

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
    let { departmentCode } = req.params;

    departmentCode = departmentCode.toUpperCase();

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
    let { departmentCode } = req.params;

    departmentCode = departmentCode.toUpperCase();

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

// Get all applicants assigned to the logged-in department head's department
async function getApplicantsForDepartmentHead(req, res) {
  try {
    const departmentHead = req.user;
    console.log('🔍 Department Head User Data:', {
      id: departmentHead?._id,
      name: departmentHead?.name,
      email: departmentHead?.email,
      department: departmentHead?.department,
      role: departmentHead?.role
    });
    
    if (!departmentHead) {
      console.log('❌ No department head user found in request');
      return res.status(400).json({ message: 'Department head user not found in request.' });
    }
    
    if (!departmentHead.department) {
      console.log('❌ Department head does not have a department assigned');
      return res.status(400).json({ message: 'Department head does not have a department assigned.' });
    }
    const User = require('../models/User');
    const ApplicationForm = require('../models/ApplicationForm');
    const applicantRole = await require('../models/Role').findOne({ name: 'applicant' });
    console.log('🔍 Applicant Role Found:', applicantRole ? { id: applicantRole._id, name: applicantRole.name } : 'NOT FOUND');
    
    if (!applicantRole) {
      console.log('❌ Applicant role not found in database');
      return res.status(400).json({ message: 'Applicant role not found.' });
    }
    
    // Find users assigned to this department
    console.log('🔍 Searching for users with:', {
      role: applicantRole._id,
      department: departmentHead.department
    });
    
    const assignedUsers = await User.find({
      role: applicantRole._id,
      department: departmentHead.department
    }).select('_id name idNumber email');
    
    console.log('🔍 Users found with applicant role and COE department:', assignedUsers.length);
    
    // Also check all users with applicant role (regardless of department)
    const allApplicants = await User.find({
      role: applicantRole._id
    }).select('_id name idNumber email department');
    
    console.log('🔍 All users with applicant role:', allApplicants.map(u => ({
      id: u._id,
      name: u.name,
      department: u.department
    })));
    
    // Get application data for these users
    const applicantsWithApplications = [];
    for (const user of assignedUsers) {
      const application = await ApplicationForm.findOne({ user: user._id });
      if (application) {
        applicantsWithApplications.push({
          _id: user._id,
          id: user._id,
          name: user.name,
          idNumber: user.idNumber,
          email: user.email,
          firstName: application.firstName,
          lastName: application.lastName,
          programOfStudyAndYear: application.programOfStudyAndYear,
          status: application.status
        });
      }
    }
    
    console.log('Found applicants for department head:', applicantsWithApplications);
    res.json(applicantsWithApplications);
  } catch (error) {
    console.error('Error in getApplicantsForDepartmentHead:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

// Assign a user (applicant) to a department
async function assignApplicantToDepartment(req, res) {
  try {
    const { userId, departmentCode } = req.body;
    console.log('🔍 Assignment Request:', { userId, departmentCode });
    
    if (!userId || !departmentCode) {
      return res.status(400).json({ message: 'userId and departmentCode are required.' });
    }
    
    const User = require('../models/User');
    const Department = require('../models/Department');
    
    const user = await User.findById(userId);
    console.log('🔍 User Found:', user ? { id: user._id, name: user.name, currentDepartment: user.department } : 'NOT FOUND');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const department = await Department.findOne({ departmentCode });
    console.log('🔍 Department Found:', department ? { id: department._id, code: department.departmentCode, name: department.name } : 'NOT FOUND');
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }
    
    console.log('🔄 Assigning user to department...');
    user.department = department._id;
    await user.save();
    
    // Verify the assignment was saved
    const updatedUser = await User.findById(userId);
    console.log('✅ Assignment Complete:', { 
      userId: updatedUser._id, 
      userName: updatedUser.name, 
      assignedDepartment: updatedUser.department,
      departmentCode: departmentCode 
    });
    
    res.json({ message: 'Applicant assigned to department successfully.', user: updatedUser });
  } catch (error) {
    console.error('Error in assignApplicantToDepartment:', error);
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