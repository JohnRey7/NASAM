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
      if (!files || files.length === 0) {
        throw new Error('At least one document must be uploaded');
      }

      console.log('📁 Processing files:', files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })));

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
        personalityTestPaymentReceipt: [],
        // Add grade averages if provided
        gradeAverages: additionalData.gradeAverages || undefined,
        // Add income tax info if provided
        incomeTaxInfo: additionalData.incomeTaxInfo || undefined
      };

      // Process uploaded files (files is now an array from upload.any())
      files.forEach(file => {
        const fieldName = file.fieldname;
        console.log('📁 Processing file for field:', fieldName);
        
        if (fieldName === 'studentPicture') {
          // Only take the first file for studentPicture
          documentData.studentPicture = {
            filePath: path.relative(path.join(__dirname, '../'), file.path).replace(/\\/g, '/'),
            originalName: file.originalname,
            uploadedAt: new Date()
          };
          console.log('📁 Added studentPicture:', documentData.studentPicture);
        } else if (documentData.hasOwnProperty(fieldName)) {
          // Handle array fields
          const fileData = {
            filePath: path.relative(path.join(__dirname, '../'), file.path).replace(/\\/g, '/'),
            originalName: file.originalname,
            uploadedAt: new Date()
          };
          documentData[fieldName].push(fileData);
          console.log(`📁 Added ${fieldName}:`, fileData);
        } else {
          console.warn(`Unknown field ${fieldName} received in file upload`);
        }
      });

      // Check if user already has documents
      let document = await DocumentUpload.findOne(SoftDeleteUtils.addSoftDeleteFilter({ user: userId }));
      let oldFiles = [];
      
      if (document) {
        // For studentPicture (single field): collect old file for deletion if being replaced
        if (documentData.studentPicture && document.studentPicture && document.studentPicture.filePath) {
          oldFiles.push(path.join(__dirname, '../', document.studentPicture.filePath));
        }

        // Update document - APPEND to array fields, REPLACE single fields
        Object.keys(documentData).forEach(key => {
          if (key === 'user') return; // Skip user field
          
          if (key === 'studentPicture') {
            // Single field - replace if new data provided
            if (documentData[key] !== null) {
              document[key] = documentData[key];
            }
          } else if (Array.isArray(documentData[key]) && documentData[key].length > 0) {
            // Array field - APPEND new documents to existing ones
            if (!document[key]) document[key] = [];
            document[key] = [...document[key], ...documentData[key]];
          } else if (key === 'gradeAverages' || key === 'incomeTaxInfo') {
            // Object fields - update if provided
            if (documentData[key] !== undefined) {
              document[key] = documentData[key];
            }
          }
        });
      } else {
        // Create new document
        document = new DocumentUpload(documentData);
      }

      await document.save();
      console.log('✅ Document saved successfully with ID:', document._id);
      console.log('✅ Document user field:', document.user);
      console.log('✅ Document is_deleted field:', document.is_deleted);

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
          personalityTestPaymentReceipt: document.personalityTestPaymentReceipt,
          gradeAverages: document.gradeAverages,
          incomeTaxInfo: document.incomeTaxInfo,
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
      console.log('🔍 Getting documents for user ID:', userId);
      const query = SoftDeleteUtils.addSoftDeleteFilter({ user: userId });
      console.log('🔍 Query with soft delete filter:', query);
      
      const document = await DocumentUpload.findOne(query)
        .populate('user', 'name idNumber email');

      console.log('🔍 Found document:', !!document);
      if (document) {
        console.log('🔍 Document fields:', Object.keys(document.toObject()));
      }

      if (!document) {
        // Check if document exists without soft delete filter
        const documentWithoutFilter = await DocumentUpload.findOne({ user: userId });
        console.log('🔍 Document exists without soft delete filter:', !!documentWithoutFilter);
        if (documentWithoutFilter) {
          console.log('🔍 Document is_deleted status:', documentWithoutFilter.is_deleted);
        }
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
          personalityTestPaymentReceipt: document.personalityTestPaymentReceipt,
          gradeAverages: document.gradeAverages,
          incomeTaxInfo: document.incomeTaxInfo,
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
        ...document.homeLocationSketch,
        ...document.personalityTestPaymentReceipt
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
    if (files && Array.isArray(files)) {
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.warn(`Failed to clean up file ${file.path}:`, unlinkError.message);
        }
      }
    }
  }

  static async createUploadNotification(userId, files) {
    try {
      const uploadedTypes = [];
      const fieldNameMap = {
        studentPicture: 'Student Picture',
        nbiClearance: 'NBI Clearance',
        gradeReport: 'Grade Report',
        incomeTaxReturn: 'Income Tax Return',
        goodMoralCertificate: 'Good Moral Certificate',
        physicalCheckup: 'Physical Checkup',
        homeLocationSketch: 'Home Location Sketch',
        personalityTestPaymentReceipt: 'Personality Test Payment Receipt'
      };

      // Extract unique field names from files array
      const uniqueFields = [...new Set(files.map(file => file.fieldname))];
      
      uniqueFields.forEach(fieldName => {
        if (fieldNameMap[fieldName]) {
          uploadedTypes.push(fieldNameMap[fieldName]);
        }
      });

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