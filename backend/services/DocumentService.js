const DocumentUpload = require('../models/DocumentUpload');
const ApplicationForm = require('../models/ApplicationForm');
const NotificationService = require('../services/NotificationService');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');
const path = require('path');
const fs = require('fs').promises;

class DocumentService {
  static async uploadDocuments(userId, files, additionalData = {}) {
    try {
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
        homeLocationSketch: [],
        // Add grade averages if provided
        gradeAverages: additionalData.gradeAverages || undefined,
        // Add income tax info if provided
        incomeTaxInfo: additionalData.incomeTaxInfo || undefined
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

      // Check if user already has documents
      let document = await DocumentUpload.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }));
      let oldFiles = [];
      
      if (document) {
        // Collect old files for deletion
        oldFiles = [
          ...(document.studentPicture ? [document.studentPicture] : []),
          ...document.nbiClearance,
          ...document.gradeReport,
          ...document.incomeTaxReturn,
          ...document.goodMoralCertificate,
          ...document.physicalCheckup,
          ...document.certificates,
          ...document.homeLocationSketch
        ].map(doc => path.join(__dirname, '../', doc.filePath));

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

      // Delete old files from storage after successful save
      if (oldFiles.length > 0) {
        await this.deleteFiles(oldFiles);
      }

      // Create notification for uploaded documents
      await this.createUploadNotification(userId, files);

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
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  static async getDocuments(userId) {
    try {
      const document = await DocumentUpload.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }))
        .populate('user', 'name idNumber email');

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
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  static async deleteDocuments(userId) {
    try {
      const document = await DocumentUpload.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }));
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

      await this.deleteFiles(filesToDelete);

      // Delete document from MongoDB
      await DocumentUpload.deleteOne({ user: userId });

      return { message: 'Documents deleted successfully' };
    } catch (error) {
      console.error('Error deleting documents:', error);
      throw error;
    }
  }

  static async deleteFiles(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error.message);
      }
    }
  }

  static async cleanupUploadedFiles(files) {
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
  }

  static async createUploadNotification(userId, files) {
    try {
      const uploadedTypes = [];
      if (files.studentPicture) uploadedTypes.push('Student Picture');
      if (files.nbiClearance) uploadedTypes.push('NBI Clearance');
      if (files.gradeReport) uploadedTypes.push('Grade Report');
      if (files.incomeTaxReturn) uploadedTypes.push('Income Tax Return');
      if (files.goodMoralCertificate) uploadedTypes.push('Good Moral Certificate');
      if (files.physicalCheckup) uploadedTypes.push('Physical Checkup');
      if (files.homeLocationSketch) uploadedTypes.push('Home Location Sketch');

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
    } catch (error) {
      console.error('Error creating upload notification:', error);
      // Don't throw error here as it's not critical to the main operation
    }
  }

  // Soft Delete Methods
  static async softDeleteDocument(documentId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(DocumentUpload, documentId);
      return { message: 'Document soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting document:', error);
      throw error;
    }
  }

  static async restoreDocument(documentId) {
    try {
      const result = await SoftDeleteUtils.restoreById(DocumentUpload, documentId);
      return { message: 'Document restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring document:', error);
      throw error;
    }
  }

  static async permanentDeleteDocument(documentId) {
    try {
      const result = await SoftDeleteUtils.permanentDeleteById(DocumentUpload, documentId);
      return { message: 'Document permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting document:', error);
      throw error;
    }
  }

  static async getSoftDeletedDocuments(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(DocumentUpload, query);
    } catch (error) {
      console.error('Error getting soft deleted documents:', error);
      throw error;
    }
  }
}

module.exports = DocumentService;