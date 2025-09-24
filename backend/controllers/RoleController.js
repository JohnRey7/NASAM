const RoleService = require('../services/RoleService');

// Initialize permissions
async function initializePermissions() {
  try {
    const result = await RoleService.initializePermissions();
    return result;
  } catch (error) {
    console.error('Error in initializePermissions:', error);
    throw error;
  }
}

// Initialize roles
async function initializeRoles() {
  try {
    const result = await RoleService.initializeRoles();
    return result;
  } catch (error) {
    console.error('Error in initializeRoles:', error);
    throw error;
  }
}

// Create a role
async function createRole(req, res) {
  try {
    const result = await RoleService.createRole(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error in createRole:', error);
    const statusCode = error.message.includes('already exists') ? 400 :
                      error.message.includes('required') ? 400 :
                      error.message.includes('Invalid permissions') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get all roles
async function getAllRoles(req, res) {
  try {
    const result = await RoleService.getAllRoles(req.query);
    res.json(result);
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    const statusCode = error.message.includes('Invalid') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get a role by ID
async function getRoleById(req, res) {
  try {
    const { id } = req.params;
    const result = await RoleService.getRoleById(id);
    res.json(result);
  } catch (error) {
    console.error('Error in getRoleById:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get a role by name
async function getRoleByName(req, res) {
  try {
    const { name } = req.params;
    const result = await RoleService.getRoleByName(name);
    res.json(result);
  } catch (error) {
    console.error('Error in getRoleByName:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Update a role by ID
async function updateRoleById(req, res) {
  try {
    const { id } = req.params;
    const result = await RoleService.updateRoleById(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error in updateRoleById:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('Cannot update') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Delete a role by ID
async function deleteRoleById(req, res) {
  try {
    const { id } = req.params;
    const result = await RoleService.deleteRoleById(id);
    res.json(result);
  } catch (error) {
    console.error('Error in deleteRoleById:', error);
    const statusCode = error.message.includes('Invalid') ? 400 :
                      error.message.includes('not found') ? 404 :
                      error.message.includes('Cannot delete') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
}

// Get all permissions
async function getAllPermissions(req, res) {
  try {
    const result = await RoleService.getAllPermissions();
    res.json(result);
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  initializePermissions,
  initializeRoles,
  createRole,
  getAllRoles,
  getRoleById,
  getRoleByName,
  updateRoleById,
  deleteRoleById,
  getAllPermissions
};
