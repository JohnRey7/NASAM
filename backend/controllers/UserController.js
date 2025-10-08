const UserService = require('../services/UserService');
const argon2 = require('argon2');

const UserController = {
  // Create a new user (admin only)
  async createUser(req, res) {
    try {
      const { name, idNumber, email, password, roleId, courseId, departmentId } = req.body;

      // Validate required fields
      if (!name || !idNumber || !password || !roleId) {
        return res.status(400).json({
          message: 'Name, ID number, password, and role are required'
        });
      }

      // Hash password before creating user
      const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

      const userData = {
        name,
        idNumber,
        email,
        password: hashedPassword,
        roleId,
        courseId,
        departmentId
      };

      const user = await UserService.createUser(userData);

      return res.status(201).json({
        message: 'User created successfully',
        user
      });
    } catch (error) {
      console.error('Create user error:', error);
      if (error.message.includes('already exists') || error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to create user' });
    }
  },

  // Get all users with pagination and filtering
  async getAllUsers(req, res) {
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
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        roleId,
        courseId,
        departmentId,
        disabled,
        includeDeleted: includeDeleted === 'true'
      };

      const result = await UserService.getAllUsers(options);

      return res.json({
        message: 'Users retrieved successfully',
        ...result
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ message: 'Failed to retrieve users' });
    }
  },

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await UserService.getUserById(id);

      return res.json({
        message: 'User retrieved successfully',
        user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to retrieve user' });
    }
  },

  // Get user by ID Number
  async getUserByIdNumber(req, res) {
    try {
      const { idNumber } = req.params;

      if (!idNumber) {
        return res.status(400).json({ message: 'User ID Number is required' });
      }

      const user = await UserService.getUserByIdNumber(idNumber);

      return res.json({
        message: 'User retrieved successfully',
        user
      });
    } catch (error) {
      console.error('Get user by ID Number error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to retrieve user' });
    }
  },

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Remove password from update data if present (should use separate endpoint)
      delete updateData.password;
      delete updateData.disabled; // Use separate endpoints for disable/enable

      const user = await UserService.updateUser(id, updateData);

      return res.json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      console.error('Update user error:', error);
      if (error.message.includes('not found') || error.message.includes('already exists') || error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to update user' });
    }
  },

  // Update user by ID Number
  async updateUserByIdNumber(req, res) {
    try {
      const { idNumber } = req.params;
      const updateData = req.body;

      if (!idNumber) {
        return res.status(400).json({ message: 'User ID Number is required' });
      }

      // Remove password from update data if present (should use separate endpoint)
      delete updateData.password;
      delete updateData.disabled; // Use separate endpoints for disable/enable

      const user = await UserService.updateUserByIdNumber(idNumber, updateData);

      return res.json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      console.error('Update user by ID Number error:', error);
      if (error.message.includes('not found') || error.message.includes('already exists') || error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to update user' });
    }
  },

  // Delete user (soft delete)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const result = await UserService.deleteUser(id);

      return res.json({
        message: 'User deleted successfully',
        user: result
      });
    } catch (error) {
      console.error('Delete user error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  },

  // Delete user by ID Number (soft delete)
  async deleteUserByIdNumber(req, res) {
    try {
      const { idNumber } = req.params;

      if (!idNumber) {
        return res.status(400).json({ message: 'User ID Number is required' });
      }

      const result = await UserService.deleteUserByIdNumber(idNumber);

      return res.json({
        message: 'User deleted successfully',
        user: result
      });
    } catch (error) {
      console.error('Delete user by ID Number error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to delete user' });
    }
  },

  // Restore user
  async restoreUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const result = await UserService.restoreUser(id);

      return res.json({
        message: 'User restored successfully',
        user: result
      });
    } catch (error) {
      console.error('Restore user error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to restore user' });
    }
  },

  // Permanently delete user
  async permanentDeleteUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      await UserService.permanentDeleteUser(id);

      return res.json({
        message: 'User permanently deleted successfully'
      });
    } catch (error) {
      console.error('Permanent delete user error:', error);
      if (error.message === 'User not found') {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to permanently delete user' });
    }
  },

  // Get soft deleted users
  async getSoftDeletedUsers(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await UserService.getSoftDeletedUsers(options);

      return res.json({
        message: 'Soft deleted users retrieved successfully',
        ...result
      });
    } catch (error) {
      console.error('Get soft deleted users error:', error);
      return res.status(500).json({ message: 'Failed to retrieve soft deleted users' });
    }
  },

  // Disable user
  async disableUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await UserService.disableUser(id);

      return res.json({
        message: 'User disabled successfully',
        user
      });
    } catch (error) {
      console.error('Disable user error:', error);
      if (error.message.includes('not found') || error.message.includes('already disabled')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to disable user' });
    }
  },

  // Disable user by ID Number
  async disableUserByIdNumber(req, res) {
    try {
      const { idNumber } = req.params;

      if (!idNumber) {
        return res.status(400).json({ message: 'User ID Number is required' });
      }

      const user = await UserService.disableUserByIdNumber(idNumber);

      return res.json({
        message: 'User disabled successfully',
        user
      });
    } catch (error) {
      console.error('Disable user by ID Number error:', error);
      if (error.message.includes('not found') || error.message.includes('already disabled')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to disable user' });
    }
  },

  // Enable user
  async enableUser(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await UserService.enableUser(id);

      return res.json({
        message: 'User enabled successfully',
        user
      });
    } catch (error) {
      console.error('Enable user error:', error);
      if (error.message.includes('not found') || error.message.includes('already enabled')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to enable user' });
    }
  },

  // Enable user by ID Number
  async enableUserByIdNumber(req, res) {
    try {
      const { idNumber } = req.params;

      if (!idNumber) {
        return res.status(400).json({ message: 'User ID Number is required' });
      }

      const user = await UserService.enableUserByIdNumber(idNumber);

      return res.json({
        message: 'User enabled successfully',
        user
      });
    } catch (error) {
      console.error('Enable user by ID Number error:', error);
      if (error.message.includes('not found') || error.message.includes('already enabled')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Failed to enable user' });
    }
  },

  // Get disabled users
  async getDisabledUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      };

      const result = await UserService.getDisabledUsers(options);

      return res.json({
        message: 'Disabled users retrieved successfully',
        ...result
      });
    } catch (error) {
      console.error('Get disabled users error:', error);
      return res.status(500).json({ message: 'Failed to retrieve disabled users' });
    }
  }
};

module.exports = UserController;