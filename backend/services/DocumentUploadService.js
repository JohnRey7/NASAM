const DocumentUpload = require('../models/DocumentUpload');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');
const fs = require('fs').promises;
const path = require('path');

class DocumentUploadService {
  // File validation constants
  static FILE_SIZE_LIMITS = {
    studentPicture: 5 * 1024 * 1024, // 5MB for photos
    default: 10 * 1024 * 1024 // 10MB for other documents
  };

  static ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  static ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Validate file
  static validateFile(file, fieldName) {
    if (!file) return true; // Optional files

    // Check file size
    const sizeLimit = this.FILE_SIZE_LIMITS[fieldName] || this.FILE_SIZE_LIMITS.default;
    if (file.size > sizeLimit) {
      const limitMB = sizeLimit / (1024 * 1024);
      throw new Error(`File size for ${fieldName} exceeds ${limitMB}MB limit`);
    }

    // Check file type
    const allowedTypes = fieldName === 'studentPicture' 
      ? this.ALLOWED_PHOTO_TYPES 
      : this.ALLOWED_DOCUMENT_TYPES;
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type for ${fieldName}. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return true;
  }

  // Process file upload
  static processFileUpload(file) {
    if (!file) return null;
    
    // Extract just the filename from the full path
    // file.path might be "uploads/documents/filename.png" or "files/filename.png"
    // We only want "filename.png"
    const fileName = file.filename || path.basename(file.path);
    
    return {
      filePath: fileName,  // Just the filename, not the full path
      originalName: file.originalname,
      uploadedAt: new Date()
    };
  }

  // Upload or update documents
  static async uploadDocuments(userId, files, additionalData = {}) {
    try {
      console.log('📤 Upload request - files received:', files ? Object.keys(files) : 'none');
      
      // Validate files
      if (files) {
        Object.entries(files).forEach(([fieldName, fileArray]) => {
          const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
          fileList.forEach(file => this.validateFile(file, fieldName));
        });
      }

      // Find existing document or create new one
      let document = await DocumentUpload.findOne(
        SoftDeleteUtils.addSoftDeleteFilter({ user: userId })
      );

      console.log('📄 Existing studentPicture before update:', document?.studentPicture);

      if (!document) {
        document = new DocumentUpload({ user: userId });
      }

      // Process each file field
      if (files) {
        Object.entries(files).forEach(([fieldName, fileArray]) => {
          const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
          
          console.log(`🔍 Processing field: ${fieldName}, has file:`, !!fileList[0]);
          
          if (fieldName === 'studentPicture') {
            // Single file field - only update if file is provided
            if (fileList[0]) {
              console.log('✅ Updating studentPicture with new file');
              document[fieldName] = this.processFileUpload(fileList[0]);
            } else {
              console.log('⏭️ Skipping studentPicture - no file provided, keeping existing');
            }
            // If no file provided, keep existing value (don't overwrite)
          } else {
            // Array fields - only add new files, don't replace existing
            if (!document[fieldName]) document[fieldName] = [];
            fileList.forEach(file => {
              if (file) {
                document[fieldName].push(this.processFileUpload(file));
              }
            });
          }
        });
      }
      
      console.log('📄 studentPicture after update:', document.studentPicture);

      // Add semester duration if provided
      if (additionalData.semesterDuration) {
        if (!document.semesterDuration) document.semesterDuration = [];
        document.semesterDuration.push(additionalData.semesterDuration);
      }

      await document.save();
      
      return await DocumentUpload.findById(document._id)
        .populate('user', 'name idNumber email')
        .lean();
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  // Get documents by user ID
  static async getDocuments(userId) {
    try {
      const document = await DocumentUpload.findOne(
        SoftDeleteUtils.addSoftDeleteFilter({ user: userId })
      ).populate('user', 'name idNumber email').lean();

      if (!document) {
        // Return empty document structure instead of throwing error
        return {
          user: userId,
          studentPicture: null,
          nbiClearance: [],
          gradeReport: [],
          incomeTaxReturn: [],
          goodMoralCertificate: [],
          physicalCheckup: [],
          homeLocationSketch: [],
          gradeAverages: null,
          incomeTaxInfo: null,
          createdAt: null,
          updatedAt: null
        };
      }

      return document;
    } catch (error) {
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  // Get all documents with pagination
  static async getAllDocuments(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = ''
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Build search query
      let searchQuery = SoftDeleteUtils.addSoftDeleteFilter({});
      if (search) {
        searchQuery = {
          ...searchQuery,
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.idNumber': { $regex: search, $options: 'i' } }
          ]
        };
      }

      const documents = await DocumentUpload.find(searchQuery)
        .populate('user', 'name idNumber email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await DocumentUpload.countDocuments(searchQuery);

      return {
        documents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalDocuments: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw error;
    }
  }

  // Update specific document
  static async updateDocument(documentId, userId, files, updateData) {
    try {
      const document = await DocumentUpload.findOne(
        SoftDeleteUtils.addSoftDeleteFilter({ _id: documentId, user: userId })
      );

      if (!document) {
        throw new Error('Document not found or user not authorized');
      }

      // Validate files
      if (files) {
        Object.entries(files).forEach(([fieldName, fileArray]) => {
          const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
          fileList.forEach(file => this.validateFile(file, fieldName));
        });
      }

      // Update files
      if (files) {
        Object.entries(files).forEach(([fieldName, fileArray]) => {
          const fileList = Array.isArray(fileArray) ? fileArray : [fileArray];
          
          if (fieldName === 'studentPicture') {
            document[fieldName] = this.processFileUpload(fileList[0]);
          } else {
            if (!document[fieldName]) document[fieldName] = [];
            document[fieldName] = document[fieldName].concat(
              fileList.map(file => this.processFileUpload(file))
            );
          }
        });
      }

      // Update semester duration if provided
      if (updateData.semesterDuration) {
        if (!document.semesterDuration) document.semesterDuration = [];
        document.semesterDuration.push(updateData.semesterDuration);
      }

      await document.save();
      
      return await DocumentUpload.findById(document._id)
        .populate('user', 'name idNumber email')
        .lean();
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  // Add end term semester grade
  static async addEndTermSemesterGrade(userId, files, gradeData) {
    try {
      if (!files || !files.gradeDocument) {
        throw new Error('Grade document file is required');
      }

      const file = Array.isArray(files.gradeDocument) ? files.gradeDocument[0] : files.gradeDocument;
      this.validateFile(file, 'gradeDocument');

      if (!gradeData.gradeSubjects || !Array.isArray(gradeData.gradeSubjects)) {
        throw new Error('Grade subjects data is required');
      }

      let document = await DocumentUpload.findOne(
        SoftDeleteUtils.addSoftDeleteFilter({ user: userId })
      );

      if (!document) {
        document = new DocumentUpload({ user: userId });
      }

      if (!document.endTermSemesterGrade) {
        document.endTermSemesterGrade = [];
      }

      const gradeEntry = {
        filePath: file.path,
        originalName: file.originalname,
        uploadedAt: new Date(),
        gradeSubjects: gradeData.gradeSubjects
      };

      document.endTermSemesterGrade.push(gradeEntry);
      await document.save();

      return await DocumentUpload.findById(document._id)
        .populate('user', 'name idNumber email')
        .lean();
    } catch (error) {
      console.error('Error adding end term semester grade:', error);
      throw error;
    }
  }

  // Update end term semester grade
  static async updateEndTermSemesterGrade(documentId, gradeId, userId, files, updateData) {
    try {
      const document = await DocumentUpload.findOne(
        SoftDeleteUtils.addSoftDeleteFilter({ _id: documentId, user: userId })
      );

      if (!document) {
        throw new Error('Document not found or user not authorized');
      }

      const gradeIndex = document.endTermSemesterGrade.findIndex(
        grade => grade._id.toString() === gradeId
      );

      if (gradeIndex === -1) {
        throw new Error('Grade entry not found');
      }

      // Update file if provided
      if (files && files.gradeDocument) {
        const file = Array.isArray(files.gradeDocument) ? files.gradeDocument[0] : files.gradeDocument;
        this.validateFile(file, 'gradeDocument');
        
        document.endTermSemesterGrade[gradeIndex].filePath = file.path;
        document.endTermSemesterGrade[gradeIndex].originalName = file.originalname;
        document.endTermSemesterGrade[gradeIndex].uploadedAt = new Date();
      }

      // Update grade subjects if provided
      if (updateData.gradeSubjects) {
        document.endTermSemesterGrade[gradeIndex].gradeSubjects = updateData.gradeSubjects;
      }

      await document.save();

      return await DocumentUpload.findById(document._id)
        .populate('user', 'name idNumber email')
        .lean();
    } catch (error) {
      console.error('Error updating end term semester grade:', error);
      throw error;
    }
  }

  // Delete document (soft delete)
  static async deleteDocument(documentId, userId) {
    try {
      const document = await DocumentUpload.findOne(
        SoftDeleteUtils.addSoftDeleteFilter({ _id: documentId, user: userId })
      );

      if (!document) {
        throw new Error('Document not found or user not authorized');
      }

      return await this.softDeleteDocument(documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // Soft delete document
  static async softDeleteDocument(documentId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(DocumentUpload, documentId);
      return { message: 'Document soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting document:', error);
      throw error;
    }
  }

  // Restore document
  static async restoreDocument(documentId) {
    try {
      const result = await SoftDeleteUtils.restoreById(DocumentUpload, documentId);
      return { message: 'Document restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring document:', error);
      throw error;
    }
  }

  // Permanent delete document
  static async permanentDeleteDocument(documentId) {
    try {
      const document = await DocumentUpload.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete physical files
      await this.deletePhysicalFiles(document);

      const result = await SoftDeleteUtils.permanentDeleteById(DocumentUpload, documentId);
      return { message: 'Document permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting document:', error);
      throw error;
    }
  }

  // Get soft deleted documents
  static async getSoftDeletedDocuments(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'deletedAt',
        sortOrder = 'desc'
      } = options;

      return await SoftDeleteUtils.getSoftDeleted(DocumentUpload, {
        page,
        limit,
        sortBy,
        sortOrder,
        populate: 'user'
      });
    } catch (error) {
      console.error('Error getting soft deleted documents:', error);
      throw error;
    }
  }

  // Delete physical files helper
  static async deletePhysicalFiles(document) {
    try {
      const filesToDelete = [];

      // Collect all file paths
      if (document.studentPicture?.filePath) {
        filesToDelete.push(document.studentPicture.filePath);
      }

      const arrayFields = [
        'nbiClearance', 'gradeReport', 'incomeTaxReturn', 
        'goodMoralCertificate', 'physicalCheckup', 'certificates', 
        'homeLocationSketch', 'endTermSemesterGrade'
      ];

      arrayFields.forEach(field => {
        if (document[field] && Array.isArray(document[field])) {
          document[field].forEach(item => {
            if (item.filePath) {
              filesToDelete.push(item.filePath);
            }
          });
        }
      });

      // Delete files
      for (const filePath of filesToDelete) {
        try {
          await fs.unlink(filePath);
        } catch (err) {
          console.warn(`Failed to delete file ${filePath}:`, err.message);
        }
      }
    } catch (error) {
      console.error('Error deleting physical files:', error);
      // Don't throw error here to avoid interrupting the main deletion process
    }
  }

  // Clean up orphaned files (utility method)
  static async cleanupOrphanedFiles() {
    try {
      // This method can be implemented to clean up files that exist on disk
      // but are no longer referenced in the database
      console.log('Cleanup orphaned files method called');
      // Implementation would involve scanning the uploads directory
      // and comparing with database records
    } catch (error) {
      console.error('Error cleaning up orphaned files:', error);
      throw error;
    }
  }
}

module.exports = DocumentUploadService;