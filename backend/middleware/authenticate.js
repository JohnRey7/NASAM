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

    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
        return res.status(401).json({ message: 'Please log in with your user credentials.' });  }
};

module.exports = authenticate;
