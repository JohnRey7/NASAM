const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sanitizePath = require('sanitize-filename');
const ApplicationForm = require('../models/ApplicationForm');

const uploadDir = path.join(__dirname, '../files');

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await require('fs').promises.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    throw new Error('Server error');
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uuid = uuidv4();
    const sanitizedName = `${uuid}${ext}`;
    cb(null, sanitizedName);
  }
});

// File filter for allowed mime types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, and PNG files are allowed'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).fields([
  { name: 'studentPicture', maxCount: 1 },
  { name: 'nbiClearance', maxCount: 5 },
  { name: 'gradeReport', maxCount: 5 },
  { name: 'incomeTaxReturn', maxCount: 5 },
  { name: 'goodBoyCertificate', maxCount: 5 },
  { name: 'physicalCheckup', maxCount: 5 },
  { name: 'certificates', maxCount: 5 },
  { name: 'homeLocationSketch', maxCount: 5 }
]);

// Middleware to check application access
const checkApplicationAccess = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;

    // Find the user's application
    const application = await ApplicationForm.findOne({ user: userId });
    if (!application) {
      return res.status(403).json({ message: 'No application found for this user' });
    }

    // Attach application to request for use in controller
    req.application = application;
    req.applicationId = application._id; // For compatibility with other middleware
    next();
  } catch (error) {
    console.error('Error in checkApplicationAccess:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export middleware
module.exports = {
  uploadDocuments: upload,
  checkApplicationAccess
};