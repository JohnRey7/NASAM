const mongoose = require('mongoose');
const Role = require('../models/Role');
const Permission = require('../models/Permissions');
const User = require('../models/User');

// Initialize permissions
async function initializePermissions() {
  const permissions = [
    'administrator',
    'application.create',
    'application.readOwn',
    'application.read',
    'application.updateOwn',
    'application.update',
    'application.delete',
    'application.readAll',
    'document.set',
    'document.get',
    'document.delete'
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
async function initializeRoles() {
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
async function initializeAdminAccount() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Initialize permissions and roles first
      await initializePermissions();
      await initializeRoles();

      const adminRole = await Role.findOne({ name: 'admin' });
      if (!adminRole) {
        throw new Error('Admin role not found after initialization');
      }

      const hashedPassword = await argon2.hash('Welcome1!', { type: argon2.argon2id });
      const adminUser = new User({
        name: 'Administrator',
        idNumber: 'Welcome1!',
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

// Run admin account initialization on startup
initializeAdminAccount();


const RoleController = {

  // Create a new role with permissions
  async createRole(req, res) {
    try {
      const { name, permissions } = req.body;

      // Validate required fields
      if (!name || !permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ message: 'Name and permissions array are required' });
      }

      // Validate permissions
      for (const permId of permissions) {
        if (!mongoose.Types.ObjectId.isValid(permId)) {
          return res.status(400).json({ message: `Invalid permission ID: ${permId}` });
        }
        const permission = await Permission.findById(permId);
        if (!permission) {
          return res.status(400).json({ message: `Permission not found for ID: ${permId}` });
        }
      }

      // Check if role name already exists
      if (await Role.findOne({ name })) {
        return res.status(400).json({ message: `Role with name '${name}' already exists` });
      }

      const role = new Role({ name, permissions });
      await role.save();

      res.status(201).json({
        message: 'Role created successfully',
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all roles
  async getAllRoles(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 10, 25);
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.name) {
        filter.name = new RegExp(req.query.name, 'i');
      }

      const roles = await Role.find(filter)
        .populate({
          path: 'permissions',
          select: 'name'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Role.countDocuments(filter);

      res.json({
        roles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get a specific role by ID
  async getRoleById(req, res) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: `Invalid role ID: ${req.params.id}` });
      }

      const role = await Role.findById(req.params.id)
        .populate({
          path: 'permissions',
          select: 'name'
        });

      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      res.json({
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update a role
  async updateRole(req, res) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: `Invalid role ID: ${req.params.id}` });
      }

      const { name, permissions } = req.body;

      // Validate input
      if (!name && (!permissions || !Array.isArray(permissions))) {
        return res.status(400).json({ message: 'At least one of name or permissions array must be provided' });
      }

      // Validate permissions if provided
      if (permissions) {
        for (const permId of permissions) {
          if (!mongoose.Types.ObjectId.isValid(permId)) {
            return res.status(400).json({ message: `Invalid permission ID: ${permId}` });
          }
          const permission = await Permission.findById(permId);
          if (!permission) {
            return res.status(400).json({ message: `Permission not found for ID: ${permId}` });
          }
        }
      }

      const role = await Role.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Check if new name is unique (if provided)
      if (name && name !== role.name) {
        if (await Role.findOne({ name })) {
          return res.status(400).json({ message: `Role with name '${name}' already exists` });
        }
        role.name = name;
      }

      // Update permissions if provided
      if (permissions) {
        role.permissions = permissions;
      }

      await role.save();

      res.json({
        message: 'Role updated successfully',
        role: {
          _id: role._id,
          name: role.name,
          permissions: role.permissions
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete a role
  async deleteRole(req, res) {
    try {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: `Invalid role ID: ${req.params.id}` });
      }

      const role = await Role.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ message: 'Role not found' });
      }

      // Prevent deletion of roles assigned to users
      const userCount = await User.countDocuments({ role: req.params.id });
      if (userCount > 0) {
        return res.status(400).json({ message: 'Cannot delete role assigned to users' });
      }

      await Role.deleteOne({ _id: req.params.id });

      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = RoleController;