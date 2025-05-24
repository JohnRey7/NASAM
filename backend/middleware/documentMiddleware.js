const ApplicationForm = require('../models/ApplicationForm'); // Assumed to exist
const fileUtils = require('../utils/FileUtils');

// Middleware to check if user has access to the application
const checkApplicationAccess = async (req, res, next) => {
  try {
    const applicationId = req.params.applicationId;
    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required' });
    }

    const application = await ApplicationForm.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Ensure req.user exists
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({ message: 'User authentication data missing' });
    }

    // Define the user reference field (matches 'user' in ApplicationForm schema)
    const userField = 'user';
    const userRef = application[userField];

    // Check if the user reference field exists and is not null
    if (!userRef) {
      console.error(`Application ${applicationId} does not have a valid ${userField} field. Application data:`, application.toObject());
      return res.status(500).json({ message: `Application data is missing or has invalid ${userField} field` });
    }

    // Authorization check
    if (req.user.role !== 'admin' && userRef.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this application' });
    }

    req.application = application; // Pass application to next handler if needed
    next();
  } catch (error) {
    console.error('Error in checkApplicationAccess:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// Middleware for handling multiple file uploads
const uploadDocuments = fileUtils.uploadMultipleFiles([
  { name: 'gradeReport', maxCount: 1 },
  { name: 'incomeTaxReturn', maxCount: 1 },
  { name: 'certificates', maxCount: 10 } // Allow up to 10 certificates
]);

module.exports = {
  checkApplicationAccess,
  uploadDocuments
};