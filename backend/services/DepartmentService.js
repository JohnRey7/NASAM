const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const ApplicationForm = require('../models/ApplicationForm');
const Role = require('../models/Role');

class DepartmentService {
  static async createDepartment(departmentData) {
    try {
      // Validate request body
      if (!departmentData || typeof departmentData !== 'object') {
        throw new Error('Department data is required');
      }

      let { departmentCode, name } = departmentData;

      // Validate required fields
      if (!departmentCode || !name) {
        throw new Error('Department code and name are required');
      }

      departmentCode = departmentCode.toUpperCase();

      // Check for existing departmentCode
      const existingDepartment = await Department.findOne({ departmentCode, is_deleted: false });
      if (existingDepartment) {
        throw new Error('Department code already exists');
      }

      // Create department
      const department = new Department({ departmentCode, name });
      await department.save();

      return department;
    } catch (error) {
      console.error('Error creating department:', error);
      if (error.code === 11000) {
        throw new Error('Department code already exists');
      }
      throw error;
    }
  }

  static async getAllDepartments(queryParams) {
    try {
      const { page = 1, limit = 10, search = '' } = queryParams;
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
      const departments = await Department.find({ ...query, is_deleted: false })
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
    } catch (error) {
      console.error('Error getting all departments:', error);
      throw error;
    }
  }

  static async getDepartmentByCode(departmentCode) {
    try {
      if (!departmentCode) {
        throw new Error('Department code is required');
      }

      departmentCode = departmentCode.toUpperCase();

      // Validate departmentCode
      if (!/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
        throw new Error('Invalid department code');
      }

      const department = await Department.findOne({ departmentCode, is_deleted: false });
      if (!department) {
        throw new Error('Department not found');
      }

      return department;
    } catch (error) {
      console.error('Error getting department by code:', error);
      throw error;
    }
  }

  static async updateDepartment(departmentCode, updateData) {
    try {
      if (!departmentCode) {
        throw new Error('Department code is required');
      }

      departmentCode = departmentCode.toUpperCase();

      // Validate departmentCode
      if (!/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
        throw new Error('Invalid department code');
      }

      // Validate request body
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Update data is required');
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
    } catch (error) {
      console.error('Error updating department:', error);
      if (error.code === 11000) {
        throw new Error('Department code already exists');
      }
      throw error;
    }
  }

  static async deleteDepartment(departmentCode) {
    try {
      if (!departmentCode) {
        throw new Error('Department code is required');
      }

      departmentCode = departmentCode.toUpperCase();

      // Validate departmentCode
      if (!/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
        throw new Error('Invalid department code');
      }

      const department = await Department.findOneAndUpdate({ departmentCode, is_deleted: false }, { is_deleted: true });
      if (!department) {
        throw new Error('Department not found');
      }

      return { message: 'Department soft deleted successfully' };
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  }

  static async getApplicantsForDepartmentHead(departmentHead) {
    try {
      console.log('🔍 Department Head User Data:', {
        id: departmentHead?._id,
        name: departmentHead?.name,
        email: departmentHead?.email,
        department: departmentHead?.department,
        role: departmentHead?.role
      });
      
      if (!departmentHead) {
        console.log('❌ No department head user found in request');
        throw new Error('Department head user not found in request');
      }
      
      if (!departmentHead.department) {
        console.log('❌ Department head does not have a department assigned');
        throw new Error('Department head does not have a department assigned');
      }

      const applicantRole = await Role.findOne({ name: 'applicant' });
      console.log('🔍 Applicant Role Found:', applicantRole ? { id: applicantRole._id, name: applicantRole.name } : 'NOT FOUND');
      
      if (!applicantRole) {
        console.log('❌ Applicant role not found in database');
        throw new Error('Applicant role not found');
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
      
      console.log('🔍 Users found with applicant role and department:', assignedUsers.length);
      
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
    } catch (error) {
      console.error('Error getting applicants for department head:', error);
      throw error;
    }
  }

  static async assignApplicantToDepartment(userId, departmentCode) {
    try {
      console.log('🔍 Assignment Request:', { userId, departmentCode });
      
      if (!userId || !departmentCode) {
        throw new Error('userId and departmentCode are required');
      }
      
      const user = await User.findById(userId);
      console.log('🔍 User Found:', user ? { id: user._id, name: user.name, currentDepartment: user.department } : 'NOT FOUND');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const department = await Department.findOne({ departmentCode });
      console.log('🔍 Department Found:', department ? { id: department._id, code: department.departmentCode, name: department.name } : 'NOT FOUND');
      
      if (!department) {
        throw new Error('Department not found');
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
      
      return { message: 'Applicant assigned to department successfully', user: updatedUser };
    } catch (error) {
      console.error('Error assigning applicant to department:', error);
      throw error;
    }
  }
}

module.exports = DepartmentService;