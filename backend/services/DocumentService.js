const DocumentUpload = require('../models/DocumentUpload');
const ApplicationForm = require('../models/ApplicationForm');
const NotificationService = require('./NotificationService');
const path = require('path');
const fs = require('fs').promises;

class DocumentService {
  // Upload or update documents for a user
  static async uploadDocuments(userId, files) {
    // Validate that at least one file is uploaded
    if (!files || Object.keys(files).length === 0) {
      throw new Error('At least one document must be uploaded');
    }

    // Prepare document data
    const documentData = {
      user: userId,
      studentPicture: null,
      nbiClearance: [],
      gradeReport: [],
      incomeTaxReturn: [],
      goodMoralCertificate: [],
      physicalCheckup: [],
      certificates: [],
      homeLocationSketch: []
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

    try {
      // Find existing document or create new
      let document = await DocumentUpload.findOne({ user: userId });
      if (document) {
        // Delete old files from storage
        const oldFiles = [
          ...(document.studentPicture ? [document.studentPicture] : []),
          ...document.nbiClearance,
          ...document.gradeReport,
          ...document.incomeTaxReturn,
          ...document.goodMoralCertificate,
          ...document.physicalCheckup,
          ...document.certificates,
          ...document.homeLocationSketch
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
          if (key !== 'user' && documentData[key] !== null && (Array.isArray(documentData[key]) ? documentData[key].length > 0 : true)) {
            document[key] = documentData[key];
          }
        });
      } else {
        // Create new document
        document = new DocumentUpload(documentData);
      }

      await document.save();

      // After successfully saving documents, determine uploaded types and create notification
      const uploadedTypes = [];
      if (files.studentPicture) uploadedTypes.push('Student Picture');
      if (files.nbiClearance) uploadedTypes.push('NBI Clearance');
      if (files.gradeReport) uploadedTypes.push('Grade Report');
      if (files.incomeTaxReturn) uploadedTypes.push('Income Tax Return');
      if (files.goodMoralCertificate) uploadedTypes.push('Good Moral Certificate');
      if (files.physicalCheckup) uploadedTypes.push('Physical Checkup');
      if (files.homeLocationSketch) uploadedTypes.push('Home Location Sketch');

      // Create notification if documents were uploaded
      if (uploadedTypes.length > 0) {
        const userApplication = await ApplicationForm.findOne({ user: userId });
        
        if (userApplication) {
          await NotificationService.createDocumentUploadedNotification(
            userId,
            userApplication._id,
            uploadedTypes
          );
        }
      }

      return {
        message: 'Documents uploaded successfully',
        document: {
          _id: document._id,
          user: document.user,
          studentPicture: document.studentPicture,
          nbiClearance: document.nbiClearance,
          gradeReport: document.gradeReport,
          incomeTaxReturn: document.incomeTaxReturn,
          goodMoralCertificate: document.goodMoralCertificate,
          physicalCheckup: document.physicalCheckup,
          certificates: document.certificates,
          homeLocationSketch: document.homeLocationSketch,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }
      };
    } catch (error) {
      // Clean up uploaded files on error
      if (files) {
        for (const field in files) {
          for (const file of files[field]) {
            try {
              await fs.unlink(file.path);
            } catch (unlinkError) {
              console.warn(`Failed to clean up file ${file.path}:`, unlinkError.message);
            }
          }
        }
      }
      throw error;
    }
  }

  // Get documents for a user
  static async getDocuments(userId) {
    const document = await DocumentUpload.findOne({ user: userId })
      .populate('user', 'name email');

    if (!document) {
      throw new Error('Documents not found for this user');
    }

    return {
      document: {
        _id: document._id,
        user: document.user,
        studentPicture: document.studentPicture,
        nbiClearance: document.nbiClearance,
        gradeReport: document.gradeReport,
        incomeTaxReturn: document.incomeTaxReturn,
        goodMoralCertificate: document.goodMoralCertificate,
        physicalCheckup: document.physicalCheckup,
        certificates: document.certificates,
        homeLocationSketch: document.homeLocationSketch,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    };
  }

  // Delete documents for a user
  static async deleteDocuments(userId) {
    const document = await DocumentUpload.findOne({ user: userId });
    if (!document) {
      throw new Error('Documents not found for this user');
    }

    // Delete files from storage
    const filesToDelete = [
      ...(document.studentPicture ? [document.studentPicture] : []),
      ...document.nbiClearance,
      ...document.gradeReport,
      ...document.incomeTaxReturn,
      ...document.goodMoralCertificate,
      ...document.physicalCheckup,
      ...document.certificates,
      ...document.homeLocationSketch
    ].map(doc => path.join(__dirname, '../', doc.filePath));

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error.message);
      }
    }

    // Delete document from MongoDB
    await DocumentUpload.deleteOne({ user: userId });

    return { message: 'Documents deleted successfully' };
  }
}

module.exports = DocumentService;