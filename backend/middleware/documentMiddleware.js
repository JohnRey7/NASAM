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
  { name: 'studentPicture', maxCount: 1 }, // Single file for studentPicture
  { name: 'nbiClearance', maxCount: 5 },
  { name: 'gradeReport', maxCount: 5 },
  { name: 'incomeTaxReturn', maxCount: 5 },
  { name: 'goodBoyCertificate', maxCount: 5 },
  { name: 'physicalCheckup', maxCount: 5 }
]);

// Middleware to check application access
const checkApplicationAccess = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    // Validate applicationId
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: `Invalid application ID: ${applicationId}` });
    }

    // Find application
    const application = await ApplicationForm.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the owner or has admin permissions
    const userId = req.user.id;
    const user = await require('../models/User').findById(userId);
    if (application.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this application' });
    }

    // Attach application to request for use in controller
    req.application = application;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export middleware
module.exports = {
  uploadDocuments: upload,
  checkApplicationAccess
};