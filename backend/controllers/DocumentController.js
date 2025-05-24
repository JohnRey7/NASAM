const DocumentUpload = require('../models/DocumentUpload');
const { checkApplicationAccess, uploadDocuments } = require('../middleware/documentMiddleware');

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