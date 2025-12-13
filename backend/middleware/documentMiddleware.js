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
  // Skip validation for non-file fields (text fields like gradeAverages, incomeTaxInfo)
  if (!file.mimetype) {
    cb(null, true);
    return;
  }

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
}).any(); // Use any() to accept any field including text fields


// Export middleware
module.exports = {
  uploadDocuments: upload
};