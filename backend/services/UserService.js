const User = require('../models/User');
const Role = require('../models/Role');
const Course = require('../models/Course');
const Department = require('../models/Department');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class UserService {
  // Create a new user (admin only)
  static async createUser(userData) {
    try {
      const { name, idNumber, email, password, roleId, courseId, departmentCode } = userData;

      // Validate required fields
      if (!name || !idNumber || !password || !roleId) {
        throw new Error('Name, ID number, password, and role are required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { idNumber },
          ...(email ? [{ email }] : [])
        ]
      });

      if (existingUser) {
        throw new Error('User with this ID number or email already exists');
      }

      // Validate role exists
      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('Invalid role ID');
      }

      // Validate course if provided
      if (courseId) {
        const course = await Course.findById(courseId);
        if (!course) {
          throw new Error('Invalid course ID');
        }
      }

      // Validate department if provided (lookup by departmentCode)
      let departmentId = null;
      if (departmentCode) {
        const department = await Department.findOne({ departmentCode });
        if (!department) {
          throw new Error('Invalid department code');
        }
        departmentId = department._id;

        // Check if department already has a head if role is department_head
        if (role.name === 'department_head') {
          const existingHead = await User.findOne({
            role: role._id,
            department: departmentId,
            is_deleted: false // Only check active users
          });

          if (existingHead) {
            throw new Error(`Department ${department.name} already has a department head assigned`);
          }
        }
      }

      const user = new User({
        name,
        idNumber,
        email,
        password, // Note: Password should be hashed in the controller before calling this service
        role: roleId,
        course: courseId,
        department: departmentId,
        verified: true // Admin-created users are automatically verified
      });

      await user.save();
      await user.populate(['role', 'course', 'department']);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination and filtering
  static async getAllUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        roleId = '',
        courseId = '',
        departmentId = '',
        disabled = '',
        includeDeleted = false
      } = options;

      // Build filter query
      let filter = {};

      // Apply soft delete filter FIRST - always exclude deleted users unless explicitly requested
      if (!includeDeleted) {
        filter.is_deleted = { $ne: true };
      }

      // Search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { idNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Role filter
      if (roleId) {
        filter.role = roleId;
      }

      // Course filter
      if (courseId) {
        filter.course = courseId;
      }

      // Department filter
      if (departmentId) {
        filter.department = departmentId;
      }

      // Disabled filter
      if (disabled !== '') {
        filter.disabled = disabled === 'true';
      }

      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password');

      const total = await User.countDocuments(filter);

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const filter = { _id: userId };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter)
        .populate('role', 'name permissions')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID Number
  static async getUserByIdNumber(idNumber) {
    try {
      const filter = { idNumber };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter)
        .populate('role', 'name permissions')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateUser(userId, updateData) {
    try {
      const { 
        name, email,
        address, phoneNumber, birthday, gender
      } = updateData;

      const filter = { _id: userId };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter);
      if (!user) {
        throw new Error('User not found');
      }

      // Check for duplicate email or idNumber if being updated
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
          throw new Error('Email already exists');
        }
      }

      // Validate gender if provided
      if (gender && !['Male', 'Female'].includes(gender)) {
        throw new Error('Gender must be either Male or Female');
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address }),
          ...(phoneNumber && { phoneNumber }),
          ...(birthday && { birthday }),
          ...(gender && { gender })
        },
        { new: true }
      )
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Update user by ID Number
  static async updateUserByIdNumber(idNumber, updateData) {
    try {
      const { 
        name, email,
        address, phoneNumber, birthday, gender
      } = updateData;

      const filter = { idNumber };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter);
      if (!user) {
        throw new Error('User not found');
      }

      // Check for duplicate email if being updated
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingUser) {
          throw new Error('Email already exists');
        }
      }

      // Validate gender if provided
      if (gender && !['Male', 'Female'].includes(gender)) {
        throw new Error('Gender must be either Male or Female');
      }

      // Update user
      const updatedUser = await User.findOneAndUpdate(
        filter,
        {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address }),
          ...(phoneNumber && { phoneNumber }),
          ...(birthday && { birthday }),
          ...(gender && { gender })
        },
        { new: true }
      )
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Delete user (soft delete) - cascades to all related data
  static async deleteUser(userId) {
    try {
      // Import required models for cascade delete
      const ApplicationForm = require('../models/ApplicationForm');
      const DocumentUpload = require('../models/DocumentUpload');
      const PersonalityTest = require('../models/PersonalityTest');
      const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
      const Interview = require('../models/Interview');
      const ScholarEvaluation = require('../models/ScholarEvaluation');
      const Evaluation = require('../models/Evaluation');
      
      // First, find all applications for this user to get applicationIds for interview deletion
      const applications = await ApplicationForm.find({ user: userId });
      const applicationIds = applications.map(app => app._id);
      
      // Soft delete the user
      const result = await SoftDeleteUtils.softDeleteById(User, userId);
      
      // Cascade soft delete to all related data
      // Soft delete application forms
      await ApplicationForm.updateMany(
        { user: userId, is_deleted: false },
        { is_deleted: true }
      );
      
      // Soft delete documents
      await DocumentUpload.updateMany(
        { user: userId, is_deleted: false },
        { is_deleted: true }
      );
      
      // Soft delete personality tests
      await PersonalityTest.updateMany(
        { user: userId, is_deleted: false },
        { is_deleted: true }
      );
      
      // Soft delete personality test answers (by applicationIds)
      if (applicationIds.length > 0) {
        await PersonalityAssessmentAnswers.updateMany(
          { applicationId: { $in: applicationIds }, is_deleted: false },
          { is_deleted: true }
        );
        
        // Soft delete interviews (by applicationIds)
        await Interview.updateMany(
          { applicationId: { $in: applicationIds }, is_deleted: false },
          { is_deleted: true }
        );
      }
      
      // Soft delete scholar evaluations (OAS staff evaluations)
      await ScholarEvaluation.updateMany(
        { scholar: userId, is_deleted: false },
        { is_deleted: true }
      );
      
      // Soft delete evaluations (Department head evaluations)
      await Evaluation.updateMany(
        { evaluateeUser: userId, is_deleted: false },
        { is_deleted: true }
      );
      
      return {
        ...result,
        cascadeDeleted: {
          applications: applicationIds.length,
          documents: true,
          personalityTests: true,
          personalityTestAnswers: true,
          interviews: true,
          scholarEvaluations: true,
          evaluations: true
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete user by ID Number (soft delete)
  static async deleteUserByIdNumber(idNumber) {
    try {
      const filter = { idNumber };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter);
      if (!user) {
        throw new Error('User not found');
      }

      // Use deleteUser method which has cascade logic
      return await this.deleteUser(user._id);
    } catch (error) {
      throw error;
    }
  }

  // Restore user and all related data
  static async restoreUser(userId) {
    try {
      // Import required models for cascade restore
      const ApplicationForm = require('../models/ApplicationForm');
      const DocumentUpload = require('../models/DocumentUpload');
      const PersonalityTest = require('../models/PersonalityTest');
      const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
      const Interview = require('../models/Interview');
      const ScholarEvaluation = require('../models/ScholarEvaluation');
      const Evaluation = require('../models/Evaluation');
      
      // First, find all applications for this user (including soft deleted)
      const applications = await ApplicationForm.find({ user: userId });
      const applicationIds = applications.map(app => app._id);
      
      // Restore the user
      const result = await SoftDeleteUtils.restoreById(User, userId);
      
      // Cascade restore to all related data
      // Restore application forms
      await ApplicationForm.updateMany(
        { user: userId, is_deleted: true },
        { is_deleted: false }
      );
      
      // Restore documents
      await DocumentUpload.updateMany(
        { user: userId, is_deleted: true },
        { is_deleted: false }
      );
      
      // Restore personality tests
      await PersonalityTest.updateMany(
        { user: userId, is_deleted: true },
        { is_deleted: false }
      );
      
      // Restore personality test answers (by applicationIds)
      if (applicationIds.length > 0) {
        await PersonalityAssessmentAnswers.updateMany(
          { applicationId: { $in: applicationIds }, is_deleted: true },
          { is_deleted: false }
        );
        
        // Restore interviews (by applicationIds)
        await Interview.updateMany(
          { applicationId: { $in: applicationIds }, is_deleted: true },
          { is_deleted: false }
        );
      }
      
      // Restore scholar evaluations (OAS staff evaluations)
      await ScholarEvaluation.updateMany(
        { scholar: userId, is_deleted: true },
        { is_deleted: false }
      );
      
      // Restore evaluations (Department head evaluations)
      await Evaluation.updateMany(
        { evaluateeUser: userId, is_deleted: true },
        { is_deleted: false }
      );
      
      return {
        ...result,
        cascadeRestored: {
          applications: applicationIds.length,
          documents: true,
          personalityTests: true,
          personalityTestAnswers: true,
          interviews: true,
          scholarEvaluations: true,
          evaluations: true
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Permanently delete user and all related data
  static async permanentDeleteUser(userId) {
    try {
      // Import required models for cascade delete
      const ApplicationForm = require('../models/ApplicationForm');
      const DocumentUpload = require('../models/DocumentUpload');
      const PersonalityTest = require('../models/PersonalityTest');
      const PersonalityAssessmentAnswers = require('../models/PersonalityTestAnswer');
      const Interview = require('../models/Interview');
      const ScholarEvaluation = require('../models/ScholarEvaluation');
      const Evaluation = require('../models/Evaluation');
      
      // First, find all applications for this user to get applicationIds
      const applications = await ApplicationForm.find({ user: userId });
      const applicationIds = applications.map(app => app._id);
      
      // Cascade permanent delete to all related data FIRST (before deleting user)
      // Delete documents
      await DocumentUpload.deleteMany({ user: userId });
      
      // Delete personality tests
      await PersonalityTest.deleteMany({ user: userId });
      
      // Delete personality test answers (by applicationIds)
      if (applicationIds.length > 0) {
        await PersonalityAssessmentAnswers.deleteMany({ applicationId: { $in: applicationIds } });
        
        // Delete interviews (by applicationIds)
        await Interview.deleteMany({ applicationId: { $in: applicationIds } });
      }
      
      // Delete scholar evaluations (OAS staff evaluations)
      await ScholarEvaluation.deleteMany({ scholar: userId });
      
      // Delete evaluations (Department head evaluations)
      await Evaluation.deleteMany({ evaluateeUser: userId });
      
      // Delete application forms
      await ApplicationForm.deleteMany({ user: userId });
      
      // Finally, permanently delete the user
      const result = await SoftDeleteUtils.permanentDeleteById(User, userId);
      
      return {
        ...result,
        cascadeDeleted: {
          applications: applicationIds.length,
          documents: true,
          personalityTests: true,
          personalityTestAnswers: true,
          interviews: true,
          scholarEvaluations: true,
          evaluations: true
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get soft deleted users
  static async getSoftDeletedUsers(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      // Query only soft-deleted users
      const users = await User.find({ is_deleted: true })
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments({ is_deleted: true });

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Disable user
  static async disableUser(userId) {
    try {
      const filter = { _id: userId };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.disabled) {
        throw new Error('User is already disabled');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { disabled: true },
        { new: true }
      )
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Disable user by ID Number
  static async disableUserByIdNumber(idNumber) {
    try {
      const filter = { idNumber };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.disabled) {
        throw new Error('User is already disabled');
      }

      const updatedUser = await User.findOneAndUpdate(
        filter,
        { disabled: true },
        { new: true }
      )
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Enable user
  static async enableUser(userId) {
    try {
      const filter = { _id: userId };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.disabled) {
        throw new Error('User is already enabled');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { disabled: false },
        { new: true }
      )
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Enable user by ID Number
  static async enableUserByIdNumber(idNumber) {
    try {
      const filter = { idNumber };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      const user = await User.findOne(filter);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.disabled) {
        throw new Error('User is already enabled');
      }

      const updatedUser = await User.findOneAndUpdate(
        filter,
        { disabled: false },
        { new: true }
      )
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .select('-password');

      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Get disabled users
  static async getDisabledUsers(options = {}) {
    try {
      const { page = 1, limit = 10, search = '' } = options;

      let filter = { disabled: true };
      SoftDeleteUtils.addSoftDeleteFilter(filter);

      // Search filter
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { idNumber: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .populate('role', 'name')
        .populate('course', 'name courseId')
        .populate('department', 'name departmentCode')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password');

      const total = await User.countDocuments(filter);

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get users who can be interviewers (oas_staff and department_head roles)
  static async getInterviewers() {
    try {
      // Find roles for oas_staff and department_head
      const interviewerRoles = await Role.find({
        name: { $in: ['oas_staff', 'department_head'] }
      });

      if (!interviewerRoles || interviewerRoles.length === 0) {
        return [];
      }

      const roleIds = interviewerRoles.map(role => role._id);

      // Find all active users with these roles
      const users = await User.find(
        SoftDeleteUtils.addSoftDeleteFilter({
          role: { $in: roleIds },
          disabled: { $ne: true }
        })
      )
        .populate('role', 'name')
        .populate('department', 'name departmentCode')
        .select('_id name email idNumber role department')
        .sort({ name: 1 })
        .lean();

      return users;
    } catch (error) {
      console.error('Error getting interviewers:', error);
      throw error;
    }
  }
}

module.exports = UserService;