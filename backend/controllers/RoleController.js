const RoleService = require('../services/RoleService');

// Initialize permissions
async function initializePermissions(req, res) {
  try {
    const result = await RoleService.initializePermissions();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in initializePermissions:', error);
    res.status(500).json({ message: error.message });
  }
}

// Create a new role
async function createRole(req, res) {
  try {
    const { name, permissions } = req.body;
    const role = await RoleService.createRole({ name, permissions });
    
    res.status(201).json(role);
  } catch (error) {
    console.error('Error in createRole:', error);
    res.status(400).json({ message: error.message });
  }
}

// Get all roles
async function getAllRoles(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await RoleService.getAllRoles({ page, limit });
    
    res.status(200).json({
      roles: result.roles,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    res.status(400).json({ message: error.message });
  }
}

// Get role by ID
async function getRoleById(req, res) {
  try {
    const { id } = req.params;
    const role = await RoleService.getRoleById(id);
    
    res.status(200).json(role);
  } catch (error) {
    console.error('Error in getRoleById:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Update role
async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;
    
    const role = await RoleService.updateRole(id, { name, permissions });
    
    res.status(200).json(role);
  } catch (error) {
    console.error('Error in updateRole:', error);
    res.status(error.message.includes('Invalid') ? 400 : 404)
       .json({ message: error.message });
  }
}

// Delete role
async function deleteRole(req, res) {
  try {
    const { id } = req.params;
    const result = await RoleService.deleteRole(id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteRole:', error);
    res.status(error.message.includes('Invalid') ? 400 :
               error.message.includes('Cannot delete') ? 409 : 404)
       .json({ message: error.message });
  }
}

// Get all permissions
async function getAllPermissions(req, res) {
  try {
    const permissions = await RoleService.getAllPermissions();
    
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    res.status(500).json({ message: 'Failed to get permissions' });
  }
}

// Get roles with user counts
async function getRolesWithUserCounts(req, res) {
  try {
    const roles = await RoleService.getRolesWithUserCounts();
    
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error in getRolesWithUserCounts:', error);
    res.status(500).json({ message: 'Failed to get roles with user counts' });
  }
}

// Add permission to role
async function addPermissionToRole(req, res) {
  try {
    const { roleId } = req.params;
    const { permissionName } = req.body;
    
    const role = await RoleService.addPermissionToRole(roleId, permissionName);
    
    res.status(200).json(role);
  } catch (error) {
    console.error('Error in addPermissionToRole:', error);
    res.status(400).json({ message: error.message });
  }
}

// Remove permission from role
async function removePermissionFromRole(req, res) {
  try {
    const { roleId } = req.params;
    const { permissionName } = req.body;
    
    const role = await RoleService.removePermissionFromRole(roleId, permissionName);
    
    res.status(200).json(role);
  } catch (error) {
    console.error('Error in removePermissionFromRole:', error);
    res.status(400).json({ message: error.message });
  }
}

// Search roles
async function searchRoles(req, res) {
  try {
    const { q: searchTerm } = req.query;
    const roles = await RoleService.searchRoles(searchTerm);
    
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error in searchRoles:', error);
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  initializePermissions,
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getAllPermissions,
  getRolesWithUserCounts,
  addPermissionToRole,
  removePermissionFromRole,
  searchRoles
};