const RoleService = require('../services/RoleService');

// Run admin account initialization on startup
RoleService.initializeAdminAccount().catch(error => {
  console.error('Error initializing admin account:', error);
});


const RoleController = {

  // Create a new role with permissions
  async createRole(req, res) {
    try {
      const result = await RoleService.createRole(req.body);
      
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('already exists') || error.message.includes('not found')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all roles
  async getAllRoles(req, res) {
    try {
      const result = await RoleService.getAllRoles(req.query);
      
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get a specific role by ID
  async getRoleById(req, res) {
    try {
      const result = await RoleService.getRoleById(req.params.id);
      
      res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update a role
  async updateRole(req, res) {
    try {
      const result = await RoleService.updateRole(req.params.id, req.body);
      
      res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('Invalid') || error.message.includes('must be provided') || error.message.includes('already exists') || error.message.includes('Permission not found')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete a role
  async deleteRole(req, res) {
    try {
      const result = await RoleService.deleteRole(req.params.id);
      
      res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('Invalid') || error.message.includes('Cannot delete')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = RoleController;