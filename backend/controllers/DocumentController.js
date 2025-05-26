const DocumentUpload = require('../models/DocumentUpload');
const ApplicationForm = require('../models/ApplicationForm');
const path = require('path');
const fs = require('fs').promises;
const mime = require('mime-types');

const DocumentController = {
  // Upload or update documents for an application
  async uploadDocuments(req, res) {
    try {
      const { applicationId } = req.params;
      const files = req.files;

      // Log received files for debugging
      console.log('Received files:', files);

      // Validate that at least one file is uploaded
      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ message: 'At least one document must be uploaded' });
      }

      // Prepare document data
      const documentData = {
        applicationId,
        studentPicture: null,
        nbiClearance: [],
        gradeReport: [],
        incomeTaxReturn: [],
        goodBoyCertificate: [],
        physicalCheckup: []
      };

      // Process uploaded files
      for (const field in files) {
        if (field === 'studentPicture' && files[field].length > 0) {
          // Only take the first file for studentPicture
          const file = files[field][0];
          documentData.studentPicture = {
            filePath: path.relative(path.join(__dirname, '../'), file.path).replace(/\\/g, '/'),
            originalName: file.originalname,
            uploadedAt: new Date()
          };
        } else if (documentData.hasOwnProperty(field)) {
          // Handle array fields
          documentData[field] = files[field].map(file => ({
            filePath: path.relative(path.join(__dirname, '../'), file.path).replace(/\\/g, '/'),
            originalName: file.originalname,
            uploadedAt: new Date()
          }));
        } else {
          console.warn(`Unknown field ${field} received in file upload`);
        }
      }

      // Log document data before saving
      console.log('Document data to save:', documentData);

      // Find existing document or create new
      let document = await DocumentUpload.findOne({ applicationId });
      if (document) {
        // Delete old files from storage
        const oldFiles = [
          ...(document.studentPicture ? [document.studentPicture] : []),
          ...document.nbiClearance,
          ...document.gradeReport,
          ...document.incomeTaxReturn,
          ...document.goodBoyCertificate,
          ...document.physicalCheckup
        ].map(doc => path.join(__dirname, '../', doc.filePath));

        for (const filePath of oldFiles) {
          try {
            await fs.unlink(filePath);
          } catch (error) {
            console.warn(`Failed to delete old file ${filePath}:`, error.message);
          }
        }

        // Update document (only update fields with new data)
        Object.keys(documentData).forEach(key => {
          if (documentData[key] !== null && (Array.isArray(documentData[key]) ? documentData[key].length > 0 : true)) {
            document[key] = documentData[key];
          }
        });
      } else {
        // Create new document
        document = new DocumentUpload(documentData);
      }

      await document.save();

      res.status(201).json({
        message: 'Documents uploaded successfully',
        document: {
          _id: document._id,
          applicationId: document.applicationId,
          studentPicture: document.studentPicture,
          nbiClearance: document.nbiClearance,
          gradeReport: document.gradeReport,
          incomeTaxReturn: document.incomeTaxReturn,
          goodBoyCertificate: document.goodBoyCertificate,
          physicalCheckup: document.physicalCheckup
        }
      });
    } catch (error) {
      console.error('Error in uploadDocuments:', error);
      // Clean up uploaded files on error
      if (req.files) {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              console.warn(`Failed to clean up file ${file.path}:`, unlinkError.message);
            }
          }
        }
      }
      res.status(400).json({ message: `Document upload failed: ${error.message}` });
    }
  },

  // Get documents for an application
  async getDocuments(req, res) {
    try {
      const { applicationId } = req.params;

      const document = await DocumentUpload.findOne({ applicationId })
        .populate('applicationId', '_id');

      if (!document) {
        return res.status(404).json({ message: 'Documents not found for this application' });
      }

      res.json({
        document: {
          _id: document._id,
          applicationId: document.applicationId,
          studentPicture: document.studentPicture,
          nbiClearance: document.nbiClearance,
          gradeReport: document.gradeReport,
          incomeTaxReturn: document.incomeTaxReturn,
          goodBoyCertificate: document.goodBoyCertificate,
          physicalCheckup: document.physicalCheckup,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete documents for an application
  async deleteDocuments(req, res) {
    try {
      const { applicationId } = req.params;

      const document = await DocumentUpload.findOne({ applicationId });
      if (!document) {
        return res.status(404).json({ message: 'Documents not found for this application' });
      }

      // Delete files from storage
      const filesToDelete = [
        ...(document.studentPicture ? [document.studentPicture] : []),
        ...document.nbiClearance,
        ...document.gradeReport,
        ...document.incomeTaxReturn,
        ...document.goodBoyCertificate,
        ...document.physicalCheckup
      ].map(doc => path.join(__dirname, '../', doc.filePath));

      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn(`Failed to delete file ${filePath}:`, error.message);
        }
      }

      // Delete document from MongoDB
      await DocumentUpload.deleteOne({ applicationId });

      res.json({ message: 'Documents deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = DocumentController;