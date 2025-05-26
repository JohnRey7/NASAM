/**
 * Middleware to check if the user has the required role
 * @param {string[]} roles - Array of allowed roles
 * @returns {function} Middleware function
 */
const roleCheck = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    
    next();
  };
};

module.exports = roleCheck; 