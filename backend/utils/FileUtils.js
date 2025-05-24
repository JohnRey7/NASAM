const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const sanitizePath = require('sanitize-filename');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

// Define upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'files');

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(err => {
  console.error('Failed to create upload directory:', err);
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const sanitizedName = sanitizePath(file.originalname);
    const extension = path.extname(sanitizedName);
    const uniqueName = `${uuidv4()}${extension}`;
    cb(null, uniqueName);
  }
});

const fileUtils = {
  // Middleware to handle file upload with customizable allowedTypes, fileSizeLimit, and optional flag
  uploadFile(fieldName, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], fileSizeLimit = 5 * 1024 * 1024, isOptional = false) {
    const fileFilter = (req, file, cb) => {
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`), false);
      }
      cb(null, true);
    };

    const upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: fileSizeLimit
      }
    }).single(fieldName);

    return (req, res, next) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ message: err.message });
        }
        if (!req.file && !isOptional) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        if (req.file) {
          req.filePath = `/files/${req.file.filename}`;
        }
        next();
      });
    };
  },

  // Middleware to handle multiple file uploads
  uploadMultipleFiles(fields) {
    const upload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        cb(null, true); // Allow all file types for simplicity; adjust as needed
      },
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit per file
      }
    }).fields(fields);

    return (req, res, next) => {
      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    };
  },

  // Function to retrieve/serve a file for viewing
  async downloadFile(fileName, res) {
    try {
      // Sanitize and validate file path
      const sanitizedFileName = sanitizePath(fileName);
      const filePath = path.join(UPLOAD_DIR, sanitizedFileName);

      // Prevent path traversal
      if (!filePath.startsWith(UPLOAD_DIR)) {
        throw new Error('Invalid file path');
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        throw new Error('File not found');
      }

      // Get MIME type for the file
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';

      // Set headers for viewing (not downloading)
      res.setHeader('Content-Type', mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // Stream file to response
      res.sendFile(filePath, (err) => {
        if (err) {
          res.status(500).json({ message: `Error sending file: ${err.message}` });
        }
      });
    } catch (error) {
      res.status(error.message === 'File not found' ? 404 : 400).json({ message: error.message });
    }
  }
};

module.exports = fileUtils;