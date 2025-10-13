const mongoose = require('mongoose');
const Role = require('../models/Role');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');
const Permission = require('../models/Permissions');
const User = require('../models/User');
const argon2 = require('argon2');

class RoleService {
  // Initialize permissions automatically from index.js routes
  static async initializePermissions() {
    try {
      // Check if permissions collection is empty
      const permissionCount = await Permission.countDocuments();
      if (permissionCount > 0) {
        console.log('Permissions already exist, skipping initialization');
        return { message: 'Permissions already initialized' };
      }

      // Auto-extracted permissions from index.js routes
      const permissions = [
        'administrator',
        'register.departmentHead',
        'user.delete',
        'user.read',
        'role.create',
        'role.read',
        'role.read.id',
        'role.update',
        'role.delete',
        'applicationForm.create',
        'application.export',
        'applicationForm.readOwn',
        'applicationForm.read',
        'applicationForm.update',
        'applicationForm.updateOwn',
        'applicationForm.delete',
        'applicationForm.status.set',
        'applicationForm.approvals.set',
        'applicationHistory.readOwn',
        'applicationHistory.read',
        'document.set',
        'document.get',
        'document.delete',
        'document.read',
        'personality_test.create',
        'personality_test.answer',
        'personality_test.stop',
        'personality_test.readOwn',
        'personality_test.readAll',
        'personality_test.read',
        'personality_test.update',
        'personality_test.delete',
        'personality_test.template.create',
        'personality_test.template.read',
        'personality_test.template.update',
        'personality_test.template.delete',
        'interview.create',
        'application.readAll',
        'interview.readAll',
        'interview.read',
        'interview.readOwn',
        'interview.update',
        'interview.updateOwn',
        'interview.delete',
        'interview.deleteOwn',
        'evaluation.create',
        'evaluation.read',
        'evaluation.update',
        'evaluation.delete',
        'evaluation.update_timekeeping',
        'evaluation.read_timekeeping',
        'department.create',
        'department.read',
        'department.update',
        'department.delete',
        'activity.readAll',
        'user.create',
        'user.update'
      ];

      for (const perm of permissions) {
        await Permission.findOneAndUpdate(
          { name: perm },
          { name: perm },
          { upsert: true, new: true }
        );
      }
      console.log('Permissions initialized');
      return { message: 'Permissions initialized successfully' };
    } catch (error) {
      console.error('Error initializing permissions:', error);
      throw error;
    }
  }

  // Initialize roles
  static async initializeRoles() {
    try {
      // Fetch all permissions
      const allPermissions = await Permission.find({});

      // Find the 'administrator' permission specifically
      const adminPermission = await Permission.findOne({ name: 'administrator' });
      if (!adminPermission) {
        throw new Error('Administrator permission not found');
      }

      // Create or update admin role with only the 'administrator' permission
      await Role.findOneAndUpdate(
        { name: 'admin' },
        { name: 'admin', permissions: [adminPermission._id] }, // Assign only the 'administrator' permission
        { upsert: true, new: true }
      );

      // Create or update user role with all permissions except admin-specific ones
      const userPermissions = allPermissions
        .filter(p => !['administrator', 'application.update', 'application.delete', 'application.readAll', 'document.delete'].includes(p.name))
        .map(p => p._id);

      // Ensure users can create applications
      const createAppPermission = allPermissions.find(p => p.name === 'applicationForm.create');
      if (createAppPermission && !userPermissions.includes(createAppPermission._id)) {
        userPermissions.push(createAppPermission._id);
      }

      await Role.findOneAndUpdate(
        { name: 'user' },
        { name: 'user', permissions: userPermissions },
        { upsert: true, new: true }
      );

      console.log('Roles initialized');
      return { message: 'Roles initialized successfully' };
    } catch (error) {
      console.error('Error initializing roles:', error);
      throw error;
    }
  }

  // Initialize admin account if users collection is empty
  static async initializeAdminAccount() {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        // Initialize permissions and roles first
        await this.initializePermissions();
        await this.initializeRoles();

        const adminRole = await Role.findOne({ name: 'admin' });
        if (!adminRole) {
          throw new Error('Admin role not found after initialization');
        }

        const hashedPassword = await argon2.hash('Welcome1!', { type: argon2.argon2id });
        const adminUser = new User({
          name: 'Administrator',
          idNumber: 'ADMIN001',
          email: 'admin@example.com',
          password: hashedPassword,
          role: adminRole._id,
          verified: true
        });
        await adminUser.save();
        console.log('Admin account created with ID: ADMIN001 and password: Welcome1!');
        return { message: 'Admin account created successfully' };
      }
      return { message: 'Admin account already exists' };
    } catch (error) {
      console.error('Error initializing admin account:', error);
      throw error;
    }
  }

  static async createRole(roleData) {
    try {
      const { name, permissions } = roleData;

      // Validate required fields
      if (!name || !permissions || !Array.isArray(permissions)) {
        throw new Error('Name and permissions array are required');
      }

      // Validate permissions
      for (const permId of permissions) {
        if (!mongoose.Types.ObjectId.isValid(permId)) {
          throw new Error(`Invalid permission ID: ${permId}`);
        }
        const permission = await Permission.findById(permId);
        if (!permission) {
          throw new Error(`Permission not found for ID: ${permId}`);
        }
      }

      // Check if role name already exists
      if (await Role.findOne({ name })) {
        throw new Error(`Role with name '${name}' already exists`);
      }

      const role = new Role({ name, permissions });
      await role.save();

      return {
        message: 'Role created successfully',
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      };
    } catch (error) {
      console.error('Error in createRole:', error);
      throw error;
    }
  }

  static async getAllRoles(query) {
    try {
      const { page = 1, limit = 10, name } = query;
      const pageNum = parseInt(page);
      const limitNum = Math.min(parseInt(limit), 25);
      const skip = (pageNum - 1) * limitNum;

      const filter = {};
      if (name) {
        filter.name = new RegExp(name, 'i');
      }

      const roles = await Role.find(filter)
        .populate({
          path: 'permissions',
          select: 'name'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Role.countDocuments(filter);

      return {
        roles,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      console.error('Error in getAllRoles:', error);
      throw error;
    }
  }

  static async getRoleById(roleId) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        throw new Error(`Invalid role ID: ${roleId}`);
      }

      const role = await Role.findById(roleId)
        .populate({
          path: 'permissions',
          select: 'name'
        });

      if (!role) {
        throw new Error('Role not found');
      }

      return {
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      };
    } catch (error) {
      console.error('Error in getRoleById:', error);
      throw error;
    }
  }

  static async updateRole(roleId, updateData) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        throw new Error(`Invalid role ID: ${roleId}`);
      }

      const { name, permissions } = updateData;

      // Validate input
      if (!name && (!permissions || !Array.isArray(permissions))) {
        throw new Error('At least one of name or permissions array must be provided');
      }

      // Validate permissions if provided
      if (permissions) {
        for (const permId of permissions) {
          if (!mongoose.Types.ObjectId.isValid(permId)) {
            throw new Error(`Invalid permission ID: ${permId}`);
          }
          const permission = await Permission.findById(permId);
          if (!permission) {
            throw new Error(`Permission not found for ID: ${permId}`);
          }
        }
      }

      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Check if new name is unique (if provided)
      if (name && name !== role.name) {
        if (await Role.findOne({ name })) {
          throw new Error(`Role with name '${name}' already exists`);
        }
        role.name = name;
      }

      // Update permissions if provided
      if (permissions) {
        role.permissions = permissions;
      }

      await role.save();

      return {
        message: 'Role updated successfully',
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      };
    } catch (error) {
      console.error('Error in updateRole:', error);
      throw error;
    }
  }

  static async deleteRole(roleId) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(roleId)) {
        throw new Error(`Invalid role ID: ${roleId}`);
      }

      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent deletion of roles assigned to users
      const userCount = await User.countDocuments({ role: roleId });
      if (userCount > 0) {
        throw new Error('Cannot delete role assigned to users');
      }

      await Role.deleteOne({ _id: roleId });

      return { message: 'Role deleted successfully' };
    } catch (error) {
      console.error('Error in deleteRole:', error);
      throw error;
    }
  }

  static async getAllPermissions() {
    try {
      const permissions = await Permission.find({}).sort({ name: 1 });
      return permissions;
    } catch (error) {
      console.error('Error in getAllPermissions:', error);
      throw error;
    }
  }

  // Soft Delete Methods
  static async softDeleteRole(roleId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(Role, roleId);
      return { message: 'Role soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting role:', error);
      throw error;
    }
  }

  static async restoreRole(roleId) {
    try {
      const result = await SoftDeleteUtils.restoreById(Role, roleId);
      return { message: 'Role restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring role:', error);
      throw error;
    }
  }

  static async permanentDeleteRole(roleId) {
    try {
      const result = await SoftDeleteUtils.permanentDeleteById(Role, roleId);
      return { message: 'Role permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting role:', error);
      throw error;
    }
  }

  static async getSoftDeletedRoles(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(Role, query);
    } catch (error) {
      console.error('Error getting soft deleted roles:', error);
      throw error;
    }
  }
}

module.exports = RoleService;