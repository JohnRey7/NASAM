const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedPhotoTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const allowedDocumentTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Check file type based on field name
  if (file.fieldname === 'studentPicture') {
    if (allowedPhotoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed for student picture'), false);
    }
  } else {
    if (allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, JPEG, JPG, PNG'), false);
    }
  }
};

// Configure multer with file size limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default limit
    files: 20 // Maximum 20 files per request
  }
});

// Custom middleware to handle different file size limits
const uploadDocumentsMiddleware = (req, res, next) => {
  // Create dynamic upload handler
  const uploadHandler = upload.fields([
    { name: 'studentPicture', maxCount: 1 },
    { name: 'nbiClearance', maxCount: 5 },
    { name: 'gradeReport', maxCount: 5 },
    { name: 'incomeTaxReturn', maxCount: 5 },
    { name: 'goodMoralCertificate', maxCount: 5 },
    { name: 'physicalCheckup', maxCount: 5 },
    { name: 'certificates', maxCount: 10 },
    { name: 'homeLocationSketch', maxCount: 5 },
    { name: 'gradeDocument', maxCount: 5 }
  ]);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum allowed size is 10MB per file (5MB for student picture)'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files uploaded'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Additional validation for student picture size (5MB limit)
    if (req.files && req.files.studentPicture) {
      const studentPicture = req.files.studentPicture[0];
      const maxPhotoSize = 5 * 1024 * 1024; // 5MB
      
      if (studentPicture.size > maxPhotoSize) {
        // Delete the uploaded file
        fs.unlink(studentPicture.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting oversized file:', unlinkErr);
        });
        
        return res.status(400).json({
          success: false,
          message: 'Student picture size exceeds 5MB limit'
        });
      }
    }

    next();
  });
};

module.exports = {
  uploadDocumentsMiddleware,
  upload
};