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
      // Comprehensive permissions list based on backend endpoints
      const permissions = [
        'administrator',
        // User management
        'user.create',
        'user.read',
        'user.update',
        'user.delete',
        // Role management
        'role.create',
        'role.read',
        'role.read.id',
        'role.update',
        'role.delete',
        // Application Form
        'applicationForm.create',
        'applicationForm.readOwn',
        'applicationForm.read',
        'applicationForm.updateOwn',
        'applicationForm.update',
        'applicationForm.delete',
        'applicationForm.status.set',
        'applicationForm.approvals.set',
        'application.export',
        'application.export.csv',
        'application.readAll',
        // Application History
        'applicationHistory.readOwn',
        'applicationHistory.read',
        // Documents
        'document.create',
        'document.set',
        'document.get',
        'document.read',
        'document.update',
        'document.delete',
        'document.upload.endTermGrade',
        // Personality Test
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
        // Interview
        'interview.create',
        'interview.readAll',
        'interview.read',
        'interview.readOwn',
        'interview.update',
        'interview.updateOwn',
        'interview.delete',
        'interview.deleteOwn',
        // Evaluation
        'evaluation.create',
        'evaluation.read',
        'evaluation.read.all',
        'evaluation.update',
        'evaluation.delete',
        'evaluation.update_timekeeping',
        'evaluation.read_timekeeping',
        'evaluation.manage',
        // Department
        'department.create',
        'department.read',
        'department.update',
        'department.delete',
        // Course
        'course.create',
        'course.read',
        'course.read.deleted',
        'course.update',
        'course.delete.soft',
        'course.delete.hard',
        // Activity
        'activity.readAll',
        // Audit
        'audit.read',
        'audit.manage'
      ];

      // Upsert all permissions (add missing ones, keep existing)
      let addedCount = 0;
      for (const perm of permissions) {
        const result = await Permission.findOneAndUpdate(
          { name: perm },
          { name: perm },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (result.isNew !== false) addedCount++;
      }
      console.log(`Permissions initialized/updated (${permissions.length} total)`);
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

      // ==================== ONLY 3 ROLES ====================
      // 1. oas_staff - Admin with full access
      // 2. department_head - Department head with limited access
      // 3. applicant - Applicant/Scholar with own data access

      // OAS STAFF ROLE - Gets administrator permission for full access (this is the admin)
      await Role.findOneAndUpdate(
        { name: 'oas_staff' },
        { name: 'oas_staff', permissions: [adminPermission._id] },
        { upsert: true, new: true }
      );

      // APPLICANT ROLE PERMISSIONS
      const applicantPermissions = [
        // Application
        'applicationForm.create',
        'applicationForm.readOwn',
        'applicationForm.updateOwn',
        'applicationHistory.readOwn',
        'application.export',  // Export own application PDF
        // Documents
        'document.set',
        'document.get',
        'document.upload.endTermGrade',
        // Personality Test
        'personality_test.create',
        'personality_test.answer',
        'personality_test.stop',
        'personality_test.readOwn',
        // Interview
        'interview.readOwn',
        'interview.updateOwn',  // For updating availability
        // Evaluation (for scholars)
        'evaluation.read_timekeeping',  // View own timekeeping
        // Reference data
        'department.read',
        'course.read'
      ];

      const applicantPermissionIds = allPermissions
        .filter(p => applicantPermissions.includes(p.name))
        .map(p => p._id);

      await Role.findOneAndUpdate(
        { name: 'applicant' },
        { name: 'applicant', permissions: applicantPermissionIds },
        { upsert: true, new: true }
      );

      // DEPARTMENT HEAD ROLE PERMISSIONS
      const departmentHeadPermissions = [
        // Application access
        'application.readAll',         // View assigned applicants list
        'applicationForm.read',        // Read application details
        'applicationHistory.read',     // View application history
        'application.export',          // Export application PDF
        // Documents
        'document.get',                // Download/view documents
        'document.read',               // Read document records
        // Personality Test
        'personality_test.read',       // View applicant's test results
        // Interview
        'interview.read',              // View interview details
        'interview.update',            // Update/reschedule interviews
        'interview.readOwn',           // View own review list
        // Evaluation
        'evaluation.create',           // Create scholar evaluations
        'evaluation.read',             // Read evaluations
        'evaluation.update',           // Update evaluations
        'evaluation.read_timekeeping', // View timekeeping records
        // Reference data
        'department.read',             // View departments
        'course.read'                  // View courses
      ];

      const departmentHeadPermissionIds = allPermissions
        .filter(p => departmentHeadPermissions.includes(p.name))
        .map(p => p._id);

      await Role.findOneAndUpdate(
        { name: 'department_head' },
        { name: 'department_head', permissions: departmentHeadPermissionIds },
        { upsert: true, new: true }
      );

      console.log('Roles initialized (oas_staff, department_head, applicant)');
      return { message: 'Roles initialized successfully' };
    } catch (error) {
      console.error('Error initializing roles:', error);
      throw error;
    }
  }

  // Initialize OAS Staff account if users collection is empty
  static async initializeAdminAccount() {
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        // Initialize permissions and roles first
        await this.initializePermissions();
        await this.initializeRoles();

        const oasStaffRole = await Role.findOne({ name: 'oas_staff' });
        if (!oasStaffRole) {
          throw new Error('OAS Staff role not found after initialization');
        }

        const hashedPassword = await argon2.hash('Welcome1!', { type: argon2.argon2id });
        const adminUser = new User({
          name: 'OAS Administrator',
          idNumber: 'OAS001',
          email: 'oas@example.com',
          password: hashedPassword,
          role: oasStaffRole._id,
          verified: true
        });
        await adminUser.save();
        console.log('OAS Staff account created with ID: OAS001 and password: Welcome1!');
        return { message: 'OAS Staff account created successfully' };
      }
      return { message: 'Users already exist, skipping admin creation' };
    } catch (error) {
      console.error('Error initializing OAS Staff account:', error);
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