const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permissions');
const User = require('../models/User');

class RoleService {
  // Initialize default permissions
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
      'personality_test.start',
      'role.create',
      'role.delete',
      'role.read',
      'role.update',
      'user.create',
      'user.delete',
      'user.read',
      'user.update'
    ];

    const createdPermissions = [];
    for (const permissionName of permissions) {
      let permission = await Permission.findOne({ name: permissionName });
      if (!permission) {
        permission = new Permission({ name: permissionName });
        await permission.save();
        createdPermissions.push(permission);
      }
    }

    return {
      message: `Initialized ${permissions.length} permissions`,
      newPermissions: createdPermissions.length,
      permissions: createdPermissions
    };
  }

  // Create a new role
  static async createRole({ name, permissions = [] }) {
    if (!name) {
      throw new Error('Role name is required');
    }

    // Check for existing role
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      throw new Error('Role already exists');
    }

    // Validate permissions
    if (permissions.length > 0) {
      const validPermissions = await Permission.find({ name: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        throw new Error('One or more permissions are invalid');
      }
    }

    // Create role
    const role = new Role({ name, permissions });
    await role.save();

    // Populate permissions and return
    const populatedRole = await Role.findById(role._id).populate('permissions');
    return populatedRole;
  }

  // Get all roles
  static async getAllRoles({ page = 1, limit = 10 } = {}) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error('Invalid page number');
    }
    if (isNaN(limitNum) || limitNum < 1) {
      throw new Error('Invalid limit');
    }

    const skip = (pageNum - 1) * limitNum;

    const roles = await Role.find({})
      .populate('permissions')
      .skip(skip)
      .limit(limitNum)
      .sort({ name: 1 })
      .lean();

    const totalCount = await Role.countDocuments();
    const totalPages = Math.ceil(totalCount / limitNum);

    return {
      roles,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    };
  }

  // Get role by ID
  static async getRoleById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid role ID');
    }

    const role = await Role.findById(id).populate('permissions');
    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  // Get role by name
  static async getRoleByName(name) {
    if (!name) {
      throw new Error('Role name is required');
    }

    const role = await Role.findOne({ name }).populate('permissions');
    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  // Update role
  static async updateRole(id, { name, permissions }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid role ID');
    }

    const role = await Role.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    // Update name if provided
    if (name) {
      // Check for existing role with same name (excluding current role)
      const existingRole = await Role.findOne({ 
        name, 
        _id: { $ne: id } 
      });
      
      if (existingRole) {
        throw new Error('Role name already exists');
      }
      
      role.name = name;
    }

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Validate permissions
      const validPermissions = await Permission.find({ name: { $in: permissions } });
      if (validPermissions.length !== permissions.length) {
        throw new Error('One or more permissions are invalid');
      }
      
      role.permissions = validPermissions.map(p => p._id);
    }

    await role.save();

    // Populate and return
    const populatedRole = await Role.findById(role._id).populate('permissions');
    return populatedRole;
  }

  // Delete role
  static async deleteRole(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid role ID');
    }

    const role = await Role.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if role is in use by any users
    const usersWithRole = await User.countDocuments({ role: id });
    if (usersWithRole > 0) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    await Role.findByIdAndDelete(id);
    
    return { message: 'Role deleted successfully' };
  }

  // Get all permissions
  static async getAllPermissions() {
    const permissions = await Permission.find({}).sort({ name: 1 });
    return permissions;
  }

  // Get roles with user counts
  static async getRolesWithUserCounts() {
    const roles = await Role.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'role',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'permissions',
          localField: 'permissions',
          foreignField: '_id',
          as: 'permissions'
        }
      },
      {
        $project: {
          name: 1,
          permissions: 1,
          createdAt: 1,
          userCount: { $size: '$users' }
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    return roles;
  }

  // Add permission to role
  static async addPermissionToRole(roleId, permissionName) {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new Error('Invalid role ID');
    }

    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const permission = await Permission.findOne({ name: permissionName });
    if (!permission) {
      throw new Error('Permission not found');
    }

    // Check if permission already exists in role
    if (role.permissions.includes(permission._id)) {
      throw new Error('Permission already exists in role');
    }

    role.permissions.push(permission._id);
    await role.save();

    const populatedRole = await Role.findById(role._id).populate('permissions');
    return populatedRole;
  }

  // Remove permission from role
  static async removePermissionFromRole(roleId, permissionName) {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      throw new Error('Invalid role ID');
    }

    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const permission = await Permission.findOne({ name: permissionName });
    if (!permission) {
      throw new Error('Permission not found');
    }

    // Remove permission from role
    role.permissions = role.permissions.filter(p => !p.equals(permission._id));
    await role.save();

    const populatedRole = await Role.findById(role._id).populate('permissions');
    return populatedRole;
  }

  // Search roles
  static async searchRoles(searchTerm) {
    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const roles = await Role.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
    .populate('permissions')
    .sort({ name: 1 });

    return roles;
  }
}

module.exports = RoleService;