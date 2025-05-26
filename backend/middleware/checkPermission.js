const User = require('../models/User');

// Middleware to check if user has the specified permission or administrator permission
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated and req.user is set
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: No user found' });
      }

      // Fetch user with populated role and permissions
      const user = await User.findById(req.user.id)
        .populate({
          path: 'role',
          populate: {
            path: 'permissions',
            select: 'name'
          }
        });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.disabled) {
        return res.status(403).json({ message: 'Account is disabled' });
      }

      // Check if the user's role has the "administrator" permission
      const isAdministrator = user.role.permissions.some(
        (permission) => permission.name === 'administrator'
      );

      if (isAdministrator) {
        // Administrators have unrestricted access
        return next();
      }

      // Check if the user's role has the specific required permission
      const hasPermission = user.role.permissions.some(
        (permission) => permission.name === requiredPermission
      );

      if (!hasPermission) {
        return res.status(403).json({ message: `Permission denied: ${requiredPermission} required` });
      }

      // Permission granted, proceed to the next middleware/controller
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = checkPermission;