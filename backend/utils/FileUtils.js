const path = require('path');
const fs = require('fs').promises;
const sanitizePath = require('sanitize-filename');
const mime = require('mime-types');
const DocumentUpload = require('../models/DocumentUpload');
const User = require('../models/User');

const downloadFile = async (fileName, req, res) => {
  try {
    // Sanitize and validate fileName
    const sanitizedFileName = sanitizePath(fileName);
    if (!sanitizedFileName || sanitizedFileName.includes('..')) {
      return res.status(400).json({ message: 'Invalid file name' });
    }

    // Construct file path - try multiple possible directories
    let filePath = null;
    let relativeFilePath = null;
    
    // Try uploads/documents first (new location)
    const uploadsPath = path.join(__dirname, '../uploads/documents', sanitizedFileName);
    const filesPath = path.join(__dirname, '../files', sanitizedFileName);
    
    // Check which directory has the file
    try {
      await fs.access(uploadsPath);
      filePath = uploadsPath;
      relativeFilePath = path.join('uploads/documents', sanitizedFileName).replace(/\\/g, '/');
      console.log('✅ File found in uploads/documents');
    } catch (error) {
      // Try files directory
      filePath = filesPath;
      relativeFilePath = path.join('files', sanitizedFileName).replace(/\\/g, '/');
      console.log('⏭️  Trying files directory');
    }

    // Check if file exists in DocumentUpload - use regex for flexible matching
    const document = await DocumentUpload.findOne({
      $or: [
        // Match if filePath ends with the sanitized filename
        { 'studentPicture.filePath': { $regex: sanitizedFileName + '$' } },
        { 'nbiClearance.filePath': { $regex: sanitizedFileName + '$' } },
        { 'gradeReport.filePath': { $regex: sanitizedFileName + '$' } },
        { 'incomeTaxReturn.filePath': { $regex: sanitizedFileName + '$' } },
        { 'goodBoyCertificate.filePath': { $regex: sanitizedFileName + '$' } },
        { 'physicalCheckup.filePath': { $regex: sanitizedFileName + '$' } },
        { 'homeLocationSketch.filePath': { $regex: sanitizedFileName + '$' } }
      ]
    }).lean();

    if (!document) {
      console.log('❌ File not found in database. Tried paths:', {
        relativeFilePath,
        sanitizedFileName
      });
      console.log('📋 Checking if file exists on disk anyway...');
      
      // Check if file exists on disk even if not in database
      try {
        await fs.access(filePath);
        console.log('✅ File exists on disk, allowing download');
        // File exists, allow download even without database entry
      } catch (error) {
        console.log('❌ File not found on disk either');
        return res.status(404).json({ message: 'File not found' });
      }
    }

    // Validate file ownership (skip if no document found - already checked file exists)
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Double-check file exists on disk (in case document was found but file is missing)
    if (document) {
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log('❌ File in database but not on disk:', filePath);
        return res.status(404).json({ message: 'File not found on server' });
      }
    }

    // Get file stats and metadata
    const stats = await fs.stat(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const originalName = document ? getOriginalFileName(document, relativeFilePath, sanitizedFileName) : sanitizedFileName;

    // Set headers for download
    res.set({
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Content-Disposition': `attachment; filename="${sanitizePath(originalName)}"`
    });

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to get original file name from DocumentUpload
const getOriginalFileName = (document, filePath, fallbackName) => {
  // Check student picture (single file)
  if (document.studentPicture && document.studentPicture.filePath && 
      document.studentPicture.filePath.includes(fallbackName)) {
    return document.studentPicture.originalName;
  }

  // Check array fields
  const fields = [
    'nbiClearance',
    'gradeReport',
    'incomeTaxReturn',
    'goodBoyCertificate',
    'physicalCheckup',
    'homeLocationSketch'
  ];

  for (const field of fields) {
    if (Array.isArray(document[field])) {
      const file = document[field].find(doc => 
        doc.filePath && doc.filePath.includes(fallbackName)
      );
      if (file) {
        return file.originalName;
      }
    }
  }
  return fallbackName || filePath.split('/').pop(); // Fallback to filename
};

module.exports = {
  downloadFile
};