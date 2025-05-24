require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const AuthController = require('./controllers/AuthController');
const ApplicationController = require('./controllers/ApplicationController');
const DocumentController = require('./controllers/DocumentController');
const fileUtils = require('./utils/FileUtils');
const authenticate = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser()); // Ensure cookieParser is included

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas (nasm_database)'))
  .catch(err => console.error('MongoDB connection error:', err));

// Admin Only Middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  next();
};

// Routes
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/logout', AuthController.logout);
app.get('/api/auth/me', authenticate, AuthController.getCurrentUser);
app.get('/api/auth/email/verify', AuthController.verifyEmail);
app.get('/api/auth/email/resend', AuthController.resendVerificationEmail);
app.put('/api/auth/email', authenticate, AuthController.updateEmail);

// Application routes
app.post('/api/application', authenticate, ApplicationController.createApplicationForm);
app.get('/api/application', authenticate, ApplicationController.getMyApplicationForm);
app.get('/api/application/:id', authenticate, ApplicationController.getApplicationFormById);
app.patch('/api/application', authenticate, ApplicationController.updateMyApplicationForm);
app.patch('/api/application/:id', authenticate, adminOnly, ApplicationController.updateApplicationForm);
app.delete('/api/application/:id', authenticate, adminOnly, ApplicationController.deleteApplicationForm);
app.get('/api/application/all', authenticate, adminOnly, ApplicationController.getAllApplicationForms);

// Document routes
app.put('/api/documents/:applicationId', authenticate, DocumentController.checkApplicationAccess, DocumentController.uploadDocuments, DocumentController.createOrUpdateDocuments);
app.get('/api/documents/:applicationId', authenticate, DocumentController.checkApplicationAccess, DocumentController.getDocuments);
app.delete('/api/documents/:applicationId', authenticate, DocumentController.checkApplicationAccess, DocumentController.deleteDocuments);

// File download route
app.get('/api/files/:fileName', authenticate, async (req, res) => {
  await fileUtils.downloadFile(req.params.fileName, res);
});

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to backend_nasm');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});