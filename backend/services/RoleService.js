const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permissions');
const User = require('../models/User');
const argon2 = require('argon2');

class RoleService {
  // Initialize permissions
  static async initializePermissions() {
    const permissions = [
      'administrator',
      'application.create',
      'application.delete',
      'application.read',
      'application.readAll',
      'application.readOwn',
      'application.update',
      'application.updateOwn',
      'department.create',
      'department.delete',
      'department.read',
      'department.update',
      'document.delete',
      'document.get',
      'document.set',
      'evaluation.create',
      'evaluation.delete',
      'evaluation.read',
      'evaluation.read_timekeeping',
      'evaluation.update',
      'evaluation.update_timekeeping',
      'personality_test.answer',
      'personality_test.create',
      'personality_test.delete',
      'personality_test.read',
      'personality_test.readAll',
      'personality_test.readOwn',
      'personality_test.stop',
      'personality_test.template.create',
      'personality_test.template.delete',
      'personality_test.template.read',
      'personality_test.template.update',
      'personality_test.update',
      'role.create',
      'role.delete',
      'role.read',
      'role.read.id',
      'role.update'
    ];

    for (const perm of permissions) {
      await Permission.findOneAndUpdate(
        { name: perm },
        { name: perm },
        { upsert: true, new: true }
      );
    }
    console.log('Permissions initialized');
  }

  // Initialize roles
  static async initializeRoles() {
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

    await Role.findOneAndUpdate(
      { name: 'user' },
      { name: 'user', permissions: userPermissions },
      { upsert: true, new: true }
    );

    console.log('Roles initialized');
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
      }
    } catch (error) {
      console.error('Error initializing admin account:', error);
    }
  }

  // Create a new role with permissions
  static async createRole(name, permissions) {
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
  }

  // Get all roles with pagination and filtering
  static async getAllRoles(options = {}) {
    const { page = 1, limit = 10, name } = options;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 25);
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
  }

  // Get a specific role by ID
  static async getRoleById(roleId) {
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
  }

  // Update a role
  static async updateRole(roleId, updateData) {
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
  }

  // Delete a role
  static async deleteRole(roleId) {
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
  }
}

module.exports = RoleService;