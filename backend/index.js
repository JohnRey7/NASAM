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
const EvaluationController = require('./controllers/EvaluationController');
const PersonalityTestController = require('./controllers/PersonalityTestController');
const DepartmentController = require("./controllers/DepartmentController");
const InterviewController = require("./controllers/InterviewController");

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
app.post('/api/application', authenticate, checkPermission('applicationForm.create'), ApplicationController.createApplicationForm);
app.get('/api/application/:id/pdf', authenticate, checkPermission('application.export'), ApplicationController.exportApplicationFormAsPDFByUserId);
app.get('/api/application/pdf', authenticate, ApplicationController.exportMyApplicationFormAsPDF);
app.get('/api/application', authenticate, checkPermission('applicationForm.readOwn'), ApplicationController.readMyApplicationForm);
app.get('/api/application/all', authenticate, checkPermission('applicationForm.read'), ApplicationController.getAllApplicationForms);
app.get('/api/application/:id', authenticate, checkPermission('applicationForm.read'), ApplicationController.readApplicationFormById);
app.get('/api/application/user/:userId', authenticate, checkPermission('applicationForm.read'), ApplicationController.readApplicationFormByUserId);
app.patch('/api/application/:id', authenticate, checkPermission('applicationForm.update'), ApplicationController.updateApplicationFormById);
app.patch('/api/application/user/:userId', authenticate, checkPermission('applicationForm.update'), ApplicationController.updateApplicationFormByUserId);
app.patch('/api/application', authenticate, checkPermission('applicationForm.updateOwn'), ApplicationController.updateMyApplicationForm);
app.delete('/api/application/:id', authenticate, checkPermission('applicationForm.delete'), ApplicationController.deleteApplicationFormById);
app.delete('/api/application/user/:userId', authenticate, checkPermission('applicationForm.delete'), ApplicationController.deleteApplicationFormByUserId);
app.put('/api/application/status', authenticate, checkPermission('applicationForm.status.set'), ApplicationController.setStatus);
app.put('/api/application/approvals', authenticate, checkPermission('applicationForm.approvals.set'), ApplicationController.setApprovalSummary);

// Application History routes
app.get('/api/application/history', authenticate, checkPermission('applicationHistory.readOwn'), ApplicationController.getMyApplicationHistory);
app.get('/api/application/history/user/:userId', authenticate, checkPermission('applicationHistory.read'), ApplicationController.getApplicationHistoryByUserId);
app.get('/api/application/history/:id', authenticate, checkPermission('applicationHistory.read'), ApplicationController.getApplicationHistoryById);

// Document routes
app.put('/api/documents', authenticate, checkPermission('document.set'), uploadDocuments, DocumentController.uploadDocuments);
app.get('/api/documents', authenticate, checkPermission('document.get'), DocumentController.getDocuments);
app.delete('/api/documents', authenticate, checkPermission('document.delete'), DocumentController.deleteDocuments);

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

// Interview Routes
app.post('/api/interview', authenticate, checkPermission('interview.create'), InterviewController.createInterview);
app.get('/api/interview/all', authenticate, checkPermission('interview.readAll'), InterviewController.getAllInterviews);
app.get('/api/interview/:id', authenticate, checkPermission('interview.read'), InterviewController.getInterviewById);
app.get('/api/interview/user/:userId', authenticate, checkPermission('interview.read'), InterviewController.getInterviewByUserId);
app.get('/api/interview', authenticate, checkPermission('interview.readOwn'), InterviewController.getMyInterview);
app.patch('/api/interview/:id', authenticate, checkPermission('interview.update'), InterviewController.updateInterviewById);
app.patch('/api/interview/user/:userId', authenticate, checkPermission('interview.update'), InterviewController.updateInterviewByUserId);
app.patch('/api/interview', authenticate, checkPermission('interview.updateOwn'), InterviewController.updateMyInterview);
app.delete('/api/interview/:id', authenticate, checkPermission('interview.delete'), InterviewController.deleteInterviewById);
app.delete('/api/interview/user/:userId', authenticate, checkPermission('interview.delete'), InterviewController.deleteInterviewByUserId);
app.delete('/api/interview', authenticate, checkPermission('interview.deleteOwn'), InterviewController.deleteMyInterview);

// Review Routes - Interview-based reviews with application and document data
app.get('/api/review/:interviewId', authenticate, checkPermission('interview.readOwn'), InterviewController.getReviewByInterviewId);
app.get('/api/review', authenticate, checkPermission('interview.readOwn'), InterviewController.getReviewList);

// Evaluation Routes
app.post('/api/evaluations', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluation);
app.get('/api/evaluations', authenticate, checkPermission('evaluation.read'), EvaluationController.getAllEvaluations);
app.get('/api/evaluations/:id', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationById);
app.patch('/api/evaluations/:id', authenticate, checkPermission('evaluation.update'), EvaluationController.updateEvaluation);
app.delete('/api/evaluations/:id', authenticate, checkPermission('evaluation.delete'), EvaluationController.deleteEvaluation);
app.patch('/api/evaluations/:id/timekeeping', authenticate, checkPermission('evaluation.update_timekeeping'), EvaluationController.updateTimeKeepingRecord);
app.get('/api/evaluations/:id/timekeeping', authenticate, checkPermission('evaluation.read_timekeeping'), EvaluationController.getTimeKeepingRecord);

// Department Routes
app.post('/api/departments', authenticate, checkPermission('department.create'), DepartmentController.createDepartment);
app.get('/api/departments', authenticate, checkPermission('department.read'), DepartmentController.getAllDepartments);
app.get('/api/departments/:departmentCode', authenticate, checkPermission('department.read'), DepartmentController.getDepartmentByCode);
app.patch('/api/departments/:departmentCode', authenticate, checkPermission('department.update'), DepartmentController.updateDepartment);
app.delete('/api/departments/:departmentCode', authenticate, checkPermission('department.delete'), DepartmentController.deleteDepartment);

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