const DocumentUpload = require('../models/DocumentUpload');
const ApplicationForm = require('../models/ApplicationForm'); // Assumed to exist
const fileUtils = require('../utils/FileUtils');

// Middleware to check if user has access to the application
const checkApplicationAccess = async (req, res, next) => {
  try {
    const applicationId = req.params.applicationId;
    const application = await ApplicationForm.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (req.user.role !== 'admin' && application.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    req.application = application; // Pass application to next handler if needed
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware for handling multiple file uploads
const uploadDocuments = fileUtils.uploadMultipleFiles([
  { name: 'gradeReport', maxCount: 1 },
  { name: 'incomeTaxReturn', maxCount: 1 },
  { name: 'certificates', maxCount: 10 } // Allow up to 10 certificates
]);

// Create or update documents (combined for simplicity)
const createOrUpdateDocuments = async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    const updateData = {};

    // Process gradeReport if uploaded
    if (req.files && req.files.gradeReport) {
      const file = req.files.gradeReport[0];
      updateData.gradeReport = {
        filePath: `/files/${file.filename}`,
        originalName: file.originalname,
        uploadedAt: new Date()
      };
    }

    // Process incomeTaxReturn if uploaded
    if (req.files && req.files.incomeTaxReturn) {
      const file = req.files.incomeTaxReturn[0];
      updateData.incomeTaxReturn = {
        filePath: `/files/${file.filename}`,
        originalName: file.originalname,
        uploadedAt: new Date()
      };
    }

    // Process certificates if uploaded
    if (req.files && req.files.certificates) {
      updateData.certificates = req.files.certificates.map(file => ({
        filePath: `/files/${file.filename}`,
        originalName: file.originalname,
        uploadedAt: new Date()
      }));
    }

    const document = await DocumentUpload.findOneAndUpdate(
      { applicationId },
      { $set: updateData },
      { new: true, upsert: true } // Create if not exists, return updated document
    );

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Read documents
const getDocuments = async (req, res) => {
  try {
    const document = await DocumentUpload.findOne({ applicationId: req.params.applicationId });
    if (!document) {
      return res.status(404).json({ message: 'Documents not found' });
    }
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete documents
const deleteDocuments = async (req, res) => {
  try {
    const document = await DocumentUpload.findOneAndDelete({ applicationId: req.params.applicationId });
    if (!document) {
      return res.status(404).json({ message: 'Documents not found' });
    }
    res.status(200).json({ message: 'Documents deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkApplicationAccess,
  uploadDocuments,
  createOrUpdateDocuments,
  getDocuments,
  deleteDocuments
};