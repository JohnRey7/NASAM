const User = require('../models/User');
const Role = require('../models/Role');
const Course = require('../models/Course');
const Department = require('../models/Department');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class UserService {
  // Create a new user (admin only)
  static async createUser(userData) {
    try {
      const { name, idNumber, email, password, roleId, courseId, departmentId } = userData;

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

      // Validate department if provided
      if (departmentId) {
        const department = await Department.findById(departmentId);
        if (!department) {
          throw new Error('Invalid department ID');
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

      // Apply soft delete filter
      if (!includeDeleted) {
        SoftDeleteUtils.addSoftDeleteFilter(filter);
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
        address, contact, birthday, gender,
        province, city, barangay, street, postalCode
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

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address }),
          ...(contact && { contact }),
          ...(birthday && { birthday }),
          ...(gender && { gender }),
          ...(province && { province }),
          ...(city && { city }),
          ...(barangay && { barangay }),
          ...(street && { street }),
          ...(postalCode && { postalCode })
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
        address, contact, birthday, gender,
        province, city, barangay, street, postalCode
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

      // Update user
      const updatedUser = await User.findOneAndUpdate(
        filter,
        {
          ...(name && { name }),
          ...(email && { email }),
          ...(address && { address }),
          ...(contact && { contact }),
          ...(birthday && { birthday }),
          ...(gender && { gender }),
          ...(province && { province }),
          ...(city && { city }),
          ...(barangay && { barangay }),
          ...(street && { street }),
          ...(postalCode && { postalCode })
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

  // Delete user (soft delete)
  static async deleteUser(userId) {
    try {
      return await SoftDeleteUtils.softDeleteById(User, userId);
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

      return await SoftDeleteUtils.softDeleteById(User, user._id);
    } catch (error) {
      throw error;
    }
  }

  // Restore user
  static async restoreUser(userId) {
    try {
      return await SoftDeleteUtils.restoreById(User, userId);
    } catch (error) {
      throw error;
    }
  }

  // Permanently delete user
  static async permanentDeleteUser(userId) {
    try {
      return await SoftDeleteUtils.permanentDeleteById(User, userId);
    } catch (error) {
      throw error;
    }
  }

  // Get soft deleted users
  static async getSoftDeletedUsers(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const users = await SoftDeleteUtils.getSoftDeleted(User, {
        populate: [
          { path: 'role', select: 'name' },
          { path: 'course', select: 'name courseId' },
          { path: 'department', select: 'name departmentCode' }
        ],
        select: '-password',
        skip,
        limit: parseInt(limit),
        sort: { deletedAt: -1 }
      });

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
}

module.exports = UserService;