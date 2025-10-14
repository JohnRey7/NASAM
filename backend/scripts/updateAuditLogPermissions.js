/**
 * Script to update existing roles with audit log permissions
 * Run this script after adding audit log functionality to existing systems
 */

const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permissions');

async function updateRolesWithAuditLogPermissions() {
  try {
    console.log('Updating roles with audit log permissions...');

    // Define audit log permissions
    const auditLogPermissions = [
      'auditLog.create',
      'auditLog.read',
      'auditLog.readOwn',
      'auditLog.update',
      'auditLog.delete',
      'auditLog.stats',
      'auditLog.cleanup'
    ];

    // Create permissions if they don't exist
    const createdPermissions = [];
    for (const permName of auditLogPermissions) {
      const permission = await Permission.findOneAndUpdate(
        { name: permName },
        { name: permName },
        { upsert: true, new: true }
      );
      createdPermissions.push(permission);
      console.log(`✓ Permission created/updated: ${permName}`);
    }

    // Update admin role with all audit log permissions
    const adminRole = await Role.findOne({ name: 'admin' });
    if (adminRole) {
      const adminPermissionIds = createdPermissions.map(p => p._id);
      
      // Add new permissions to existing ones (avoid duplicates)
      const existingPermissionIds = adminRole.permissions || [];
      const newPermissionIds = [...existingPermissionIds];
      
      adminPermissionIds.forEach(permId => {
        if (!existingPermissionIds.some(existingId => existingId.toString() === permId.toString())) {
          newPermissionIds.push(permId);
        }
      });

      adminRole.permissions = newPermissionIds;
      await adminRole.save();
      console.log('✓ Admin role updated with audit log permissions');
    }

    // Update user role with limited audit log permissions (only readOwn)
    const userRole = await Role.findOne({ name: 'user' });
    if (userRole) {
      const readOwnPermission = createdPermissions.find(p => p.name === 'auditLog.readOwn');
      
      if (readOwnPermission) {
        const existingPermissionIds = userRole.permissions || [];
        
        // Add readOwn permission if not already present
        if (!existingPermissionIds.some(existingId => existingId.toString() === readOwnPermission._id.toString())) {
          userRole.permissions.push(readOwnPermission._id);
          await userRole.save();
          console.log('✓ User role updated with audit log readOwn permission');
        }
      }
    }

    // Create department head role if it doesn't exist and give appropriate permissions
    const deptHeadPermissions = createdPermissions.filter(p => 
      ['auditLog.read', 'auditLog.readOwn', 'auditLog.stats'].includes(p.name)
    );

    const departmentHeadRole = await Role.findOne({ name: 'department_head' });
    if (departmentHeadRole) {
      const deptHeadPermissionIds = deptHeadPermissions.map(p => p._id);
      const existingPermissionIds = departmentHeadRole.permissions || [];
      const newPermissionIds = [...existingPermissionIds];
      
      deptHeadPermissionIds.forEach(permId => {
        if (!existingPermissionIds.some(existingId => existingId.toString() === permId.toString())) {
          newPermissionIds.push(permId);
        }
      });

      departmentHeadRole.permissions = newPermissionIds;
      await departmentHeadRole.save();
      console.log('✓ Department head role updated with audit log permissions');
    }

    console.log('\n🎉 Audit log permissions successfully added to roles!');
    console.log('\nPermissions summary:');
    console.log('- Admin: Full audit log access');
    console.log('- User: Can view own audit logs');
    console.log('- Department Head: Can view and get stats');

    return {
      success: true,
      message: 'Audit log permissions updated successfully',
      permissionsCreated: auditLogPermissions.length
    };

  } catch (error) {
    console.error('Error updating roles with audit log permissions:', error);
    throw error;
  }
}

module.exports = {
  updateRolesWithAuditLogPermissions
};

// If running this script directly
if (require.main === module) {
  // Connect to MongoDB
  require('dotenv').config({ path: '../.env' });
  
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      return updateRolesWithAuditLogPermissions();
    })
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}