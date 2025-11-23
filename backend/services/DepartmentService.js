const mongoose = require('mongoose');
const Department = require('../models/Department');
const User = require('../models/User');
const Role = require('../models/Role');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

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

      // Debug: Check department counts
      const totalCount = await Department.countDocuments({});
      const deletedCount = await Department.countDocuments({ is_deleted: true });
      const activeCount = await Department.countDocuments({ is_deleted: false });
      const withoutDeletedField = await Department.countDocuments({ is_deleted: { $exists: false } });
      
      console.log(`🏢 Department stats: Total=${totalCount}, Deleted=${deletedCount}, Active=${activeCount}, WithoutDeletedField=${withoutDeletedField}`);

      // Build query - include departments without is_deleted field
      let departmentQuery = {
        $or: [
          { is_deleted: false },
          { is_deleted: { $exists: false } }
        ]
      };

      // Add search if provided
      if (search) {
        departmentQuery = {
          $and: [
            {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { departmentCode: { $regex: search, $options: 'i' } }
              ]
            },
            {
              $or: [
                { is_deleted: false },
                { is_deleted: { $exists: false } }
              ]
            }
          ]
        };
      }

      console.log('🏢 Department query:', JSON.stringify(departmentQuery, null, 2));

      // Fetch departments
      const departments = await Department.find(departmentQuery)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 });

      // Get total count for pagination
      const total = await Department.countDocuments(departmentQuery);

      console.log(`🏢 Found ${departments.length} departments, total: ${total}`);

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

  // Department Head Management
  static async setDepartmentHeadById(departmentCode, userId) {
    try {
      if (!departmentCode) {
        throw new Error('Department code is required');
      }

      departmentCode = departmentCode.toUpperCase();

      // Validate departmentCode
      if (!/^[A-Za-z0-9]{2,10}$/.test(departmentCode)) {
        throw new Error('Invalid department code');
      }

      // Find department
      const department = await Department.findOne({ departmentCode, is_deleted: false });
      if (!department) {
        throw new Error('Department not found');
      }

      // If userId is null/undefined, remove department head
      if (!userId || userId === null) {
        if (!department.departmentHead) {
          return {
            message: 'Department head already not assigned',
            department: await Department.findById(department._id)
          };
        }

        // Remove current department head
        const previousHead = await User.findById(department.departmentHead);
        if (previousHead) {
          const userRole = await Role.findOne({ name: 'user' }) || await Role.findOne({ name: 'applicant' });
          if (userRole) {
            previousHead.role = userRole._id;
            previousHead.department = null;
            await previousHead.save();
          }
        }

        department.departmentHead = null;
        await department.save();

        return {
          message: 'Department head removed successfully',
          department: await Department.findById(department._id)
        };
      }

      // Validate userId if provided
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Find user
      const user = await User.findOne(SoftDeleteUtils.addSoftDeleteFilter({ _id: userId }));
      if (!user) {
        throw new Error('User not found');
      }

      // Find department_head role
      const departmentHeadRole = await Role.findOne({ name: 'department_head' });
      if (!departmentHeadRole) {
        throw new Error('Department head role not found');
      }

      // Remove previous department head if exists
      if (department.departmentHead) {
        const previousHead = await User.findById(department.departmentHead);
        if (previousHead) {
          // Find regular user role
          const userRole = await Role.findOne({ name: 'user' }) || await Role.findOne({ name: 'applicant' });
          if (userRole) {
            previousHead.role = userRole._id;
            await previousHead.save();
          }
        }
      }

      // Set new department head
      department.departmentHead = userId;
      await department.save();

      // Update user role to department_head
      user.role = departmentHeadRole._id;
      user.department = department._id;
      await user.save();

      return {
        message: 'Department head set successfully',
        department: await Department.findById(department._id).populate('departmentHead', 'name email idNumber'),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: departmentHeadRole.name
        }
      };
    } catch (error) {
      console.error('Error setting department head by ID:', error);
      throw error;
    }
  }

  static async setDepartmentHeadByIdNumber(departmentCode, idNumber) {
    try {
      if (!departmentCode) {
        throw new Error('Department code is required');
      }

      // If idNumber is null/undefined, remove department head
      if (!idNumber || idNumber === null) {
        return await DepartmentService.setDepartmentHeadById(departmentCode, null);
      }

      // Find user by idNumber
      const user = await User.findOne(SoftDeleteUtils.addSoftDeleteFilter({
        idNumber: idNumber
      }));

      if (!user) {
        throw new Error('User not found with provided idNumber');
      }

      // Use the existing setDepartmentHeadById method
      return await DepartmentService.setDepartmentHeadById(departmentCode, user._id);
    } catch (error) {
      console.error('Error setting department head by idNumber:', error);
      throw error;
    }
  }

  // Soft Delete Methods
  static async softDeleteDepartment(departmentCode) {
    try {
      const result = await SoftDeleteUtils.softDeleteByQuery(Department, { departmentCode });
      return { message: 'Department soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting department:', error);
      throw error;
    }
  }

  static async restoreDepartment(departmentCode) {
    try {
      const result = await SoftDeleteUtils.restoreByQuery(Department, { departmentCode });
      return { message: 'Department restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring department:', error);
      throw error;
    }
  }

  static async permanentDeleteDepartment(departmentCode) {
    try {
      const result = await Department.findOneAndDelete({ departmentCode });
      return { message: 'Department permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting department:', error);
      throw error;
    }
  }

  static async getSoftDeletedDepartments(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(Department, query);
    } catch (error) {
      console.error('Error getting soft deleted departments:', error);
      throw error;
    }
  }

  static async assignApplicantToDepartment(userId, departmentCode) {
    try {
      const ApplicationForm = require('../models/ApplicationForm');
      
      console.log('📋 Assigning applicant:', { userId, departmentCode });
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Check if department exists
      const upperDeptCode = departmentCode.toUpperCase();
      console.log('🔍 Looking for department with code:', upperDeptCode);
      
      const department = await Department.findOne({ 
        departmentCode: upperDeptCode, 
        is_deleted: false 
      });
      
      console.log('📍 Department found:', department ? `${department.name} (${department.departmentCode})` : 'NOT FOUND');
      
      if (!department) {
        // List all available departments for debugging
        const allDepts = await Department.find({ is_deleted: false }).select('departmentCode name');
        console.log('📋 Available departments:', allDepts.map(d => `${d.departmentCode} - ${d.name}`));
        throw new Error(`Department '${upperDeptCode}' not found. Available departments: ${allDepts.map(d => d.departmentCode).join(', ')}`);
      }

      // Find the application by user ID
      const application = await ApplicationForm.findOne({ 
        user: userId,
        is_deleted: false 
      });

      if (!application) {
        throw new Error('Application not found for this user');
      }

      // Update the application with department assignment
      application.assignedDepartment = departmentCode.toUpperCase();
      await application.save();

      console.log(`✅ Assigned applicant ${userId} to department ${departmentCode}`);

      return {
        application,
        department
      };
    } catch (error) {
      console.error('Error assigning applicant to department:', error);
      throw error;
    }
  }

  static async getApplicantsForDepartmentHead(userId) {
    try {
      const ApplicationForm = require('../models/ApplicationForm');
      
      // Find the department head user
      const departmentHead = await User.findById(userId)
        .populate('department')
        .select('department');
      
      if (!departmentHead) {
        throw new Error('Department head not found');
      }

      if (!departmentHead.department) {
        throw new Error('Department head is not assigned to any department');
      }

      const departmentCode = departmentHead.department.departmentCode;
      console.log(`🔍 Finding applicants for department: ${departmentCode}`);

      // Find all applications assigned to this department
      const applications = await ApplicationForm.find({
        assignedDepartment: departmentCode,
        is_deleted: false
      })
      .populate('user', 'name idNumber email')
      .sort({ createdAt: -1 });

      console.log(`📋 Found ${applications.length} applicants for department ${departmentCode}`);

      // Transform the data to match frontend expectations
      const applicants = applications.map(app => ({
        _id: app.user?._id || app._id,
        id: app.user?._id || app._id,
        userId: app.user?._id,
        applicationId: app._id,
        name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.user?.name || 'Unknown',
        firstName: app.firstName,
        lastName: app.lastName,
        idNumber: app.user?.idNumber || app.idNumber,
        email: app.user?.email || app.email,
        programOfStudyAndYear: app.programOfStudyAndYear || 'Not specified',
        course: app.programOfStudyAndYear || 'Not specified',
        status: app.status || 'pending',
        createdAt: app.createdAt,
        // Include all other application fields
        ...app.toObject()
      }));

      return applicants;
    } catch (error) {
      console.error('Error getting applicants for department head:', error);
      throw error;
    }
  }
}

module.exports = DepartmentService;