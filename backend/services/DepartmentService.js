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

      let { departmentCode, name, headId } = departmentData;

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

      // Validate headId if provided
      if (headId) {
        const headUser = await User.findById(headId);
        if (!headUser) {
          throw new Error('Department head not found');
        }
        
        // Verify role is department_head
        const headRole = await Role.findById(headUser.role);
        if (!headRole || headRole.name !== 'department_head') {
          throw new Error('Selected user is not a department head');
        }
        
        // Check if user is already assigned to a department
        if (headUser.department) {
           const existingDept = await Department.findById(headUser.department);
           if (existingDept) {
             throw new Error(`User is already assigned to ${existingDept.name}`);
           }
        }
      }

      // Create department
      const department = new Department({ 
        departmentCode, 
        name,
        department_head: headId || null
      });
      await department.save();

      // If headId provided, update the user's department reference
      if (headId) {
        await User.findByIdAndUpdate(headId, { department: department._id });
      }

      // Return department with head info if assigned
      const createdDepartment = department.toObject();
      if (headId) {
        const headUser = await User.findById(headId).select('name email');
        createdDepartment.head = headUser;
      }

      return createdDepartment;
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

      // Get department head role
      const headRole = await Role.findOne({ name: 'department_head' });
      const headRoleId = headRole ? headRole._id : null;

      // Fetch departments with head
      const departments = await Department.aggregate([
        { $match: departmentQuery },
        { $sort: { createdAt: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            let: { deptId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$department', '$$deptId'] },
                      { $eq: ['$role', headRoleId] },
                      { $eq: ['$is_deleted', false] }
                    ]
                  }
                }
              },
              { $project: { name: 1, email: 1 } }
            ],
            as: 'head'
          }
        },
        {
          $addFields: {
            head: { $arrayElemAt: ['$head', 0] }
          }
        }
      ]);

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

      // Get department head
      const headRole = await Role.findOne({ name: 'department_head' });
      if (headRole) {
        const head = await User.findOne({ 
          department: department._id, 
          role: headRole._id,
          is_deleted: false 
        }).select('name email');
        
        if (head) {
          return { ...department.toObject(), head };
        }
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

      const { departmentCode: newDepartmentCode, name, headId } = updateData;

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

      // Update head if provided
      if (headId !== undefined) {
        // Find current head(s) of this department and unset their department
        const headRole = await Role.findOne({ name: 'department_head' });
        if (headRole) {
           await User.updateMany(
             { department: department._id, role: headRole._id },
             { $unset: { department: 1 } }
           );
        }

        if (headId) {
          const headUser = await User.findById(headId);
          if (!headUser) {
            throw new Error('Department head not found');
          }
          
          // Verify role
          const userRole = await Role.findById(headUser.role);
          if (!userRole || userRole.name !== 'department_head') {
            throw new Error('Selected user is not a department head');
          }

          // Check if user is already assigned to another department
          if (headUser.department && headUser.department.toString() !== department._id.toString()) {
             const existingDept = await Department.findById(headUser.department);
             if (existingDept) {
               throw new Error(`User is already assigned to ${existingDept.name}`);
             }
          }
          
          // Update the user's department reference
          headUser.department = department._id;
          await headUser.save();

          // Update the department's department_head reference
          department.department_head = headId;
        } else {
          // If headId is null/empty string, clear the department_head field
          department.department_head = null;
        }
      }

      await department.save();

      // Return department with head info
      const updatedDepartment = department.toObject();
      if (headRole) {
        const head = await User.findOne({ 
          department: department._id, 
          role: headRole._id,
          is_deleted: false 
        }).select('name email');
        if (head) {
          updatedDepartment.head = head;
        }
      }

      return updatedDepartment;
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
      console.log(`🔄 Before save - assignedDepartment: ${application.assignedDepartment}`);
      application.assignedDepartment = departmentCode.toUpperCase();
      console.log(`🔄 After assignment - assignedDepartment: ${application.assignedDepartment}`);
      
      const savedApp = await application.save({ validateBeforeSave: false });
      console.log(`💾 Saved application - assignedDepartment in DB: ${savedApp.assignedDepartment}`);
      
      // Verify the save worked
      const verifyApp = await ApplicationForm.findById(application._id).select('assignedDepartment');
      console.log(`✔️ Verification - assignedDepartment in DB: ${verifyApp.assignedDepartment}`);

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

  static async getApplicantsForDepartmentHead(userId, options = {}) {
    try {
      const ApplicationForm = require('../models/ApplicationForm');
      const Course = require('../models/Course');
      const Interview = require('../models/Interview');
      const ScholarEvaluation = require('../models/ScholarEvaluation');
      
      // Pagination options
      const page = parseInt(options.page) || 1;
      const limit = Math.min(parseInt(options.limit) || 10, 50); // Max 50 per page
      const skip = (page - 1) * limit;
      const search = options.search || '';
      
      // Find the department head user with their department
      const departmentHead = await User.findById(userId)
        .populate('department')
        .select('department');
      
      if (!departmentHead) {
        throw new Error('Department head not found');
      }

      if (!departmentHead.department) {
        throw new Error('Department head is not assigned to any department');
      }

      const departmentId = departmentHead.department._id;
      const departmentCode = departmentHead.department.departmentCode;
      console.log(`🔍 Finding applicants for department: ${departmentCode} (ID: ${departmentId})`);

      // Find all courses that belong to this department
      const coursesInDepartment = await Course.find({
        departmentId: departmentId,
        is_deleted: { $ne: true }
      }).select('_id courseId name');

      console.log(`📚 Found ${coursesInDepartment.length} courses in department ${departmentCode}:`, 
        coursesInDepartment.map(c => c.courseId));

      if (coursesInDepartment.length === 0) {
        console.log(`⚠️ No courses found for department ${departmentCode}`);
        return {
          applicants: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }

      const courseIds = coursesInDepartment.map(c => c._id);

      // Find all users whose course is in this department
      const usersInDepartment = await User.find({
        course: { $in: courseIds },
        is_deleted: { $ne: true }
      }).select('_id');

      console.log(`👥 Found ${usersInDepartment.length} users with courses in department ${departmentCode}`);

      if (usersInDepartment.length === 0) {
        return {
          applicants: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }

      const userIds = usersInDepartment.map(u => u._id);

      // Build the filter for applications
      // Filter by users in department AND by assignedDepartment to ensure proper assignment
      const filter = {
        user: { $in: userIds },
        is_deleted: { $ne: true },
        // Also filter by assignedDepartment to ensure explicit assignment
        $or: [
          { assignedDepartment: departmentCode },
          { assignedDepartment: { $exists: false } } // Include if not explicitly assigned yet but user's course is in department
        ]
      };

      // Get total count for pagination
      const total = await ApplicationForm.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);

      // Find applications with pagination
      const applications = await ApplicationForm.find(filter)
        .populate({
          path: 'user',
          select: 'name idNumber email course',
          populate: {
            path: 'course',
            select: 'courseId name departmentId',
            populate: {
              path: 'departmentId',
              select: 'departmentCode name'
            }
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      console.log(`📋 Found ${applications.length} applicants for department ${departmentCode} (page ${page}/${totalPages})`);

      // Get all application IDs from the applications to batch fetch interview data
      const applicationIds = applications.map(app => app._id).filter(Boolean);
      
      // Batch fetch interview data for all applicants using applicationId
      const interviews = await Interview.find({
        applicationId: { $in: applicationIds },
        is_deleted: { $ne: true }
      }).select('applicationId startTime endTime is_finished');
      
      // Create a map for quick lookup by applicationId
      const interviewMap = new Map();
      interviews.forEach(interview => {
        interviewMap.set(interview.applicationId.toString(), interview);
      });

      // Get all user IDs to batch fetch evaluation data
      const applicantUserIds = applications.map(app => app.user?._id).filter(Boolean);
      
      // Batch fetch evaluation data for all users
      const evaluations = await ScholarEvaluation.find({
        scholar: { $in: applicantUserIds },
        is_deleted: { $ne: true }
      }).select('scholar status createdAt');
      
      // Create a map for quick lookup by user id
      const evaluationMap = new Map();
      evaluations.forEach(evaluation => {
        evaluationMap.set(evaluation.scholar.toString(), evaluation);
      });

      // Transform the data to match frontend expectations
      const applicants = applications.map(app => {
        try {
          const courseName = app.user?.course?.name || app.programOfStudyAndYear || 'Not specified';
          const courseCode = app.user?.course?.courseId || '';
          const applicationId = app._id?.toString();
          const userIdStr = app.user?._id?.toString();
          const interview = applicationId ? interviewMap.get(applicationId) : null;
          const evaluation = userIdStr ? evaluationMap.get(userIdStr) : null;
          
          return {
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
            course: courseCode ? `${courseCode} - ${courseName}` : courseName,
            courseId: app.user?.course?.courseId,
            courseName: courseName,
            department: app.user?.course?.departmentId?.name || departmentCode,
            departmentCode: app.user?.course?.departmentId?.departmentCode || departmentCode,
            applicationStatus: app.status || 'pending',
            createdAt: app.createdAt,
            assignedDepartment: app.assignedDepartment || departmentCode,
            // Include interview data to avoid N+1 queries on frontend
            interview: interview ? {
              _id: interview._id,
              startTime: interview.startTime,
              endTime: interview.endTime,
              is_finished: interview.is_finished
            } : null,
            // Include evaluation data
            evaluation: evaluation ? {
              _id: evaluation._id,
              status: evaluation.status,
              createdAt: evaluation.createdAt
            } : null
          };
        } catch (err) {
          console.error('Error transforming application:', app._id, err);
          return null;
        }
      }).filter(app => app !== null);

      return {
        applicants,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting applicants for department head:', error);
      throw error;
    }
  }
}

module.exports = DepartmentService;