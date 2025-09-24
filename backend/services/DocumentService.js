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

    // Create notification after successful upload
    const uploadedTypes = [];
    if (files.studentPicture) uploadedTypes.push('Student Picture');
    if (files.nbiClearance) uploadedTypes.push('NBI Clearance');
    if (files.gradeReport) uploadedTypes.push('Grade Report');
    if (files.incomeTaxReturn) uploadedTypes.push('Income Tax Return');
    if (files.goodMoralCertificate) uploadedTypes.push('Good Moral Certificate');
    if (files.physicalCheckup) uploadedTypes.push('Physical Checkup');
    if (files.homeLocationSketch) uploadedTypes.push('Home Location Sketch');

    // Create notification
    if (uploadedTypes.length > 0) {
      const userApplication = await ApplicationForm.findOne({ user: userId });
      
      if (userApplication) {
        await NotificationService.createDocumentUploadedNotification(
          userId,
          userApplication._id
        );
      }
    }

    return {
      document,
      uploadedTypes,
      message: `Successfully uploaded ${uploadedTypes.length} document(s): ${uploadedTypes.join(', ')}`
    };
  }

  // Get documents for a user
  static async getDocuments(userId) {
    const document = await DocumentUpload.findOne({ user: userId });
    
    if (!document) {
      throw new Error('No documents found for this user');
    }

    // Create response with file information
    const response = {
      user: document.user,
      documents: {},
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };

    // Map document fields
    const documentFields = [
      'studentPicture', 'nbiClearance', 'gradeReport', 'incomeTaxReturn',
      'goodMoralCertificate', 'physicalCheckup', 'certificates', 'homeLocationSketch'
    ];

    documentFields.forEach(field => {
      if (document[field]) {
        if (Array.isArray(document[field])) {
          response.documents[field] = document[field].map(doc => ({
            originalName: doc.originalName,
            uploadedAt: doc.uploadedAt,
            filePath: doc.filePath
          }));
        } else {
          response.documents[field] = {
            originalName: document[field].originalName,
            uploadedAt: document[field].uploadedAt,
            filePath: document[field].filePath
          };
        }
      }
    });

    return response;
  }

  // Delete documents for a user
  static async deleteDocuments(userId) {
    const document = await DocumentUpload.findOne({ user: userId });
    
    if (!document) {
      throw new Error('No documents found for this user');
    }

    // Delete files from storage
    const allFiles = [
      ...(document.studentPicture ? [document.studentPicture] : []),
      ...document.nbiClearance,
      ...document.gradeReport,
      ...document.incomeTaxReturn,
      ...document.goodMoralCertificate,
      ...document.physicalCheckup,
      ...document.certificates,
      ...document.homeLocationSketch
    ].map(doc => path.join(__dirname, '../', doc.filePath));

    // Delete physical files
    for (const filePath of allFiles) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error.message);
      }
    }

    // Delete document record from database
    await DocumentUpload.findByIdAndDelete(document._id);

    return { message: 'All documents deleted successfully' };
  }

  // Get document status for a user
  static async getDocumentStatus(userId) {
    const document = await DocumentUpload.findOne({ user: userId });
    
    const status = {
      studentPicture: !!(document?.studentPicture),
      nbiClearance: !!(document?.nbiClearance && document.nbiClearance.length > 0),
      gradeReport: !!(document?.gradeReport && document.gradeReport.length > 0),
      incomeTaxReturn: !!(document?.incomeTaxReturn && document.incomeTaxReturn.length > 0),
      goodMoralCertificate: !!(document?.goodMoralCertificate && document.goodMoralCertificate.length > 0),
      physicalCheckup: !!(document?.physicalCheckup && document.physicalCheckup.length > 0),
      homeLocationSketch: !!(document?.homeLocationSketch && document.homeLocationSketch.length > 0)
    };

    const totalRequired = 7;
    const totalUploaded = Object.values(status).filter(uploaded => uploaded).length;

    return {
      ...status,
      totalRequired,
      totalUploaded,
      completionPercentage: Math.round((totalUploaded / totalRequired) * 100),
      isComplete: totalUploaded === totalRequired
    };
  }

  // Check if user has uploaded all required documents
  static async hasAllRequiredDocuments(userId) {
    const status = await this.getDocumentStatus(userId);
    return status.isComplete;
  }

  // Get specific document file path (for download)
  static async getDocumentFilePath(userId, documentType, fileIndex = 0) {
    const document = await DocumentUpload.findOne({ user: userId });
    
    if (!document) {
      throw new Error('No documents found for this user');
    }

    const docField = document[documentType];
    if (!docField) {
      throw new Error(`No ${documentType} found for this user`);
    }

    if (Array.isArray(docField)) {
      if (fileIndex >= docField.length) {
        throw new Error(`File index ${fileIndex} out of range for ${documentType}`);
      }
      return docField[fileIndex].filePath;
    } else {
      return docField.filePath;
    }
  }

  // Delete specific document type
  static async deleteDocumentType(userId, documentType) {
    const document = await DocumentUpload.findOne({ user: userId });
    
    if (!document) {
      throw new Error('No documents found for this user');
    }

    const docField = document[documentType];
    if (!docField) {
      throw new Error(`No ${documentType} found for this user`);
    }

    // Delete files from storage
    const filesToDelete = Array.isArray(docField) 
      ? docField.map(doc => path.join(__dirname, '../', doc.filePath))
      : [path.join(__dirname, '../', docField.filePath)];

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error.message);
      }
    }

    // Remove from database
    if (Array.isArray(document[documentType])) {
      document[documentType] = [];
    } else {
      document[documentType] = null;
    }

    await document.save();

    return { message: `${documentType} deleted successfully` };
  }

  // Get document summary for admin view
  static async getDocumentsSummary() {
    const documents = await DocumentUpload.find()
      .populate('user', 'name idNumber email')
      .lean();

    return documents.map(doc => {
      const documentFields = [
        'studentPicture', 'nbiClearance', 'gradeReport', 'incomeTaxReturn',
        'goodMoralCertificate', 'physicalCheckup', 'homeLocationSketch'
      ];

      const uploadedCount = documentFields.reduce((count, field) => {
        if (doc[field]) {
          if (Array.isArray(doc[field])) {
            return count + (doc[field].length > 0 ? 1 : 0);
          } else {
            return count + 1;
          }
        }
        return count;
      }, 0);

      return {
        userId: doc.user._id,
        userName: doc.user.name,
        userIdNumber: doc.user.idNumber,
        userEmail: doc.user.email,
        totalRequired: 7,
        totalUploaded: uploadedCount,
        completionPercentage: Math.round((uploadedCount / 7) * 100),
        isComplete: uploadedCount === 7,
        lastUpdated: doc.updatedAt
      };
    });
  }

  // Validate file type and size
  static validateFile(file, allowedTypes, maxSize = 5 * 1024 * 1024) { // 5MB default
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    return true;
  }

  // Get allowed file types for each document type
  static getAllowedFileTypes() {
    return {
      studentPicture: ['image/jpeg', 'image/jpg', 'image/png'],
      nbiClearance: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      gradeReport: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      incomeTaxReturn: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      goodMoralCertificate: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      physicalCheckup: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      homeLocationSketch: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    };
  }
}

module.exports = DocumentService;