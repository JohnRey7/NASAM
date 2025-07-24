const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');

const authenticate = async (req, res, next) => {
  let token = req.cookies.jwt;
  if (!token && req.header('Authorization')) {
    token = req.header('Authorization').replace('Bearer ', '');
  }

    if (!token) {    return res.status(401).json({ message: 'Please log in with your user credentials.' });  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const blacklistedToken = await BlacklistedToken.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({ message: 'You are logged out. Please log in again.' });
    }

    // Fetch full user data from database including department
    const User = require('../models/User');
    const fullUser = await User.findById(decoded.id).populate('role').populate('department');
    
    if (!fullUser) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    // Set req.user with full user data
    req.user = {
      id: fullUser._id,
      name: fullUser.name,
      email: fullUser.email,
      idNumber: fullUser.idNumber,
      role: fullUser.role._id,
      roleName: fullUser.role.name,
      department: fullUser.department,
      verified: fullUser.verified,
      disabled: fullUser.disabled
    };
    
    next();
  } catch (error) {
    console.error(error);
        return res.status(401).json({ message: 'Please log in with your user credentials.' });  }
};

module.exports = authenticate;
