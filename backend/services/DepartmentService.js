const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const ApplicationForm = require('../models/ApplicationForm');
const Role = require('../models/Role');

class DepartmentService {
  // Create a new department
  static async createDepartment(departmentCode, name) {
    if (!departmentCode || !name) {
      throw new Error('Department code and name are required');
    }

    departmentCode = departmentCode.toUpperCase();

    // Check for existing departmentCode
    const existingDepartment = await Department.findOne({ departmentCode });
    if (existingDepartment) {
      throw new Error('Department code already exists');
    }

    // Create department
    const department = new Department({ departmentCode, name });
    await department.save();

    return department;
  }

  // Get all departments with pagination and search
  static async getAllDepartments(options = {}) {
    const { page = 1, limit = 10, search = '' } = options;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
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

    return {
      data: departments,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    };
  }

  // Get a department by departmentCode
  static async getDepartmentByCode(departmentCode) {
    departmentCode = departmentCode.toUpperCase();

    // Validate departmentCode
    if (!departmentCode || !/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
      throw new Error('Invalid department code');
    }

    const department = await Department.findOne({ departmentCode });
    if (!department) {
      throw new Error('Department not found');
    }

    return department;
  }

  // Update a department by departmentCode
  static async updateDepartment(departmentCode, updateData) {
    departmentCode = departmentCode.toUpperCase();

    // Validate departmentCode
    if (!departmentCode || !/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
      throw new Error('Invalid department code');
    }

    const { departmentCode: newDepartmentCode, name } = updateData;

    // Find department
    const department = await Department.findOne({ departmentCode });
    if (!department) {
      throw new Error('Department not found');
    }

    // Check for departmentCode conflict
    if (newDepartmentCode && newDepartmentCode !== department.departmentCode) {
      const existingDepartment = await Department.findOne({ departmentCode: newDepartmentCode });
      if (existingDepartment) {
        throw new Error('Department code already exists');
      }
      department.departmentCode = newDepartmentCode;
    }

    // Update fields
    if (name) department.name = name;

    await department.save();
    return department;
  }

  // Delete a department by departmentCode
  static async deleteDepartment(departmentCode) {
    departmentCode = departmentCode.toUpperCase();

    // Validate departmentCode
    if (!departmentCode || !/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
      throw new Error('Invalid department code');
    }

    const department = await Department.findOneAndDelete({ departmentCode });
    if (!department) {
      throw new Error('Department not found');
    }

    return { message: 'Department deleted successfully' };
  }

  // Get all applicants assigned to the department head's department
  static async getApplicantsForDepartmentHead(departmentHead) {
    console.log('🔍 Department Head User Data:', {
      id: departmentHead?._id,
      name: departmentHead?.name,
      email: departmentHead?.email,
      department: departmentHead?.department,
      role: departmentHead?.role
    });
    
    if (!departmentHead) {
      console.log('❌ No department head user found in request');
      throw new Error('Department head user not found in request.');
    }
    
    if (!departmentHead.department) {
      console.log('❌ Department head does not have a department assigned');
      throw new Error('Department head does not have a department assigned.');
    }

    const applicantRole = await Role.findOne({ name: 'applicant' });
    console.log('🔍 Applicant Role Found:', applicantRole ? { id: applicantRole._id, name: applicantRole.name } : 'NOT FOUND');
    
    if (!applicantRole) {
      console.log('❌ Applicant role not found in database');
      throw new Error('Applicant role not found.');
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
    return applicantsWithApplications;
  }

  // Assign a user (applicant) to a department
  static async assignApplicantToDepartment(userId, departmentCode) {
    console.log('🔍 Assignment Request:', { userId, departmentCode });
    
    if (!userId || !departmentCode) {
      throw new Error('userId and departmentCode are required.');
    }
    
    const user = await User.findById(userId);
    console.log('🔍 User Found:', user ? { id: user._id, name: user.name, currentDepartment: user.department } : 'NOT FOUND');
    
    if (!user) {
      throw new Error('User not found.');
    }
    
    const department = await Department.findOne({ departmentCode });
    console.log('🔍 Department Found:', department ? { id: department._id, code: department.departmentCode, name: department.name } : 'NOT FOUND');
    
    if (!department) {
      throw new Error('Department not found.');
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
    
    return { 
      message: 'Applicant assigned to department successfully.', 
      user: updatedUser 
    };
  }
}

module.exports = DepartmentService;