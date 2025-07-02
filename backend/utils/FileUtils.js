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

    // Construct file path
    const filePath = path.join(__dirname, '../files', sanitizedFileName);
    const relativeFilePath = path.join('files', sanitizedFileName).replace(/\\/g, '/');

    // Check if file exists in DocumentUpload
    const document = await DocumentUpload.findOne({
      $or: [
        { 'studentPicture.filePath': relativeFilePath },
        { 'nbiClearance.filePath': relativeFilePath },
        { 'gradeReport.filePath': relativeFilePath },
        { 'incomeTaxReturn.filePath': relativeFilePath },
        { 'goodBoyCertificate.filePath': relativeFilePath },
        { 'physicalCheckup.filePath': relativeFilePath }
      ]
    }).lean();

    if (!document) {
      return res.status(404).json({ message: 'File not associated with any document' });
    }

    // Validate file ownership
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if file exists on disk
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Get file stats and metadata
    const stats = await fs.stat(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const originalName = getOriginalFileName(document, relativeFilePath);

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
const getOriginalFileName = (document, filePath) => {
  if (document.studentPicture && document.studentPicture.filePath === filePath) {
    return document.studentPicture.originalName;
  }

  const fields = [
    'nbiClearance',
    'gradeReport',
    'incomeTaxReturn',
    'goodBoyCertificate',
    'physicalCheckup'
  ];

  for (const field of fields) {
    const file = document[field].find(doc => doc.filePath === filePath);
    if (file) {
      return file.originalName;
    }
  }
  return filePath.split('/').pop(); // Fallback to filename
};

module.exports = {
  downloadFile
};