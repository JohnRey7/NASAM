require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const AuthController = require('./controllers/AuthController');
const ApplicationController = require('./controllers/ApplicationController');
const DocumentController = require('./controllers/DocumentController');
const RoleController = require('./controllers/RoleController');
const PanelistController = require('./controllers/PanelistController');
const EvaluationController = require('./controllers/EvaluationController');
const PersonalityTestController = require('./controllers/PersonalityTestController');
const fileUtils = require('./utils/FileUtils');
const authenticate = require('./middleware/authenticate');
const checkPermission = require('./middleware/checkPermission');
const { checkApplicationAccess, uploadDocuments } = require('./middleware/documentMiddleware');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3000;

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3001');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB Atlas (nasm_database)');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/logout', AuthController.logout);
app.post('/api/auth/change-password', authenticate, AuthController.changePassword);
app.get('/api/auth/me', authenticate, AuthController.getCurrentUser);
app.get('/api/auth/email/verify', AuthController.verifyEmail);
app.get('/api/auth/email/resend', AuthController.resendVerificationEmail);
app.put('/api/auth/email', authenticate, AuthController.updateEmail);
app.post('/api/auth/change-password', authenticate, AuthController.changePassword);


// Role routes
app.post('/api/roles', authenticate, checkPermission('role.create'), RoleController.createRole);
app.get('/api/roles', authenticate, checkPermission('role.read'), RoleController.getAllRoles);
app.get('/api/roles/:id', authenticate, checkPermission('role.read.id'), RoleController.getRoleById);
app.patch('/api/roles/:id', authenticate, checkPermission('role.update'), RoleController.updateRole);
app.delete('/api/roles/:id', authenticate, checkPermission('role.delete'), RoleController.deleteRole);

// Application routes
app.post('/api/application', authenticate, checkPermission('application.create'), ApplicationController.createApplicationForm);
app.get('/api/application/me', authenticate, checkPermission('application.readOwn'), ApplicationController.getMyApplicationForm);
app.patch('/api/application/me', authenticate, checkPermission('application.updateOwn'), ApplicationController.updateMyApplicationForm);
app.get('/api/application/:id', authenticate, checkPermission('application.read'), ApplicationController.getApplicationFormById);
app.patch('/api/application/:id', authenticate, checkPermission('application.update'), ApplicationController.updateApplicationForm);
app.delete('/api/application/:id', authenticate, checkPermission('application.delete'), ApplicationController.deleteApplicationForm);
app.get('/api/application/all', authenticate, checkPermission('application.retrieve.all'), ApplicationController.getAllApplicationForms);

// Document routes
app.put('/api/documents', authenticate, checkPermission('document.set'), checkApplicationAccess, uploadDocuments, DocumentController.uploadDocuments);
app.get('/api/documents', authenticate, checkPermission('document.get'), checkApplicationAccess, DocumentController.getDocuments);
app.delete('/api/documents', authenticate, checkPermission('document.delete'), checkApplicationAccess, DocumentController.deleteDocuments);

// Profile picture route
app.put('/api/documents/profile-picture', authenticate, checkPermission('document.set'), uploadDocuments, DocumentController.uploadProfilePicture);

// Personality Test routes
app.post('/api/personality-test/start', authenticate, checkPermission('personality_test.create'), PersonalityTestController.startPersonalityTest);
app.post('/api/personality-test/answer', authenticate, checkPermission('personality_test.answer'), PersonalityTestController.answerPersonalityTest);
app.get('/api/personality-test/stop', authenticate, checkPermission('personality_test.stop'), PersonalityTestController.stopPersonalityTest);
app.get('/api/personality-test/me', authenticate, checkPermission('personality_test.readOwn'), PersonalityTestController.getMyPersonalityTest);
app.get('/api/personality-test/all', authenticate, checkPermission('personality_test.readAll'), PersonalityTestController.getAllUserPersonalityTest);
app.get('/api/personality-test/user/:userId', authenticate, checkPermission('personality_test.read'), PersonalityTestController.getPersonalityTestByUserId);
app.patch('/api/personality-test/test/:testId', authenticate, checkPermission('personality_test.update'), PersonalityTestController.updatePersonalityTest);
app.delete('/api/personality-test/user/:userId', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.deletePersonalityTestByUserId);

// Personality Test Template routes
app.post('/api/personality-test/template', authenticate, checkPermission('personality_test.template.create'), PersonalityTestController.createTemplate);
app.get('/api/personality-test/template', authenticate, checkPermission('personality_test.template.read'), PersonalityTestController.getAllTemplates);
app.get('/api/personality-test/template/:id', authenticate, checkPermission('personality_test.template.read'), PersonalityTestController.getTemplateById);
app.patch('/api/personality-test/template/:id', authenticate, checkPermission('personality_test.template.update'), PersonalityTestController.updateTemplate);
app.delete('/api/personality-test/template/:id', authenticate, checkPermission('personality_test.template.delete'), PersonalityTestController.deleteTemplate);

// Panelist Routes
app.post('/api/panelists', authenticate, checkPermission('panelist.create'), PanelistController.createPanelist);
app.get('/api/panelists', authenticate, checkPermission('panelist.read'), PanelistController.getAllPanelists);
app.get('/api/panelists/:id', authenticate, checkPermission('panelist.read'), PanelistController.getPanelistById);
app.patch('/api/panelists/:id', authenticate, checkPermission('panelist.update'), PanelistController.updatePanelist);
app.delete('/api/panelists/:id', authenticate, checkPermission('panelist.delete'), PanelistController.deletePanelist);

// Evaluation Routes
app.post('/api/evaluations', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluation);
app.get('/api/evaluations', authenticate, checkPermission('evaluation.read'), EvaluationController.getAllEvaluations);
app.get('/api/evaluations/:id', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationById);
app.patch('/api/evaluations/:id', authenticate, checkPermission('evaluation.update'), EvaluationController.updateEvaluation);
app.delete('/api/evaluations/:id', authenticate, checkPermission('evaluation.delete'), EvaluationController.deleteEvaluation);
app.patch('/api/evaluations/:id/timekeeping', authenticate, checkPermission('evaluation.update_timekeeping'), EvaluationController.updateTimeKeepingRecord);
app.get('/api/evaluations/:id/timekeeping', authenticate, checkPermission('evaluation.read_timekeeping'), EvaluationController.getTimeKeepingRecord);


// File download route
app.get('/api/files/:fileName', authenticate, checkPermission('document.get'), async (req, res) => {
  await fileUtils.downloadFile(req.params.fileName, req, res);
});

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to backend_nasm');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof mongoose.MulterError) {
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

// Graceful shutdown
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
});