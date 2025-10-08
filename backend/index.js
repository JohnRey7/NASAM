require('dotenv').config({ path: './.env' });

// Debug: Check if environment variables are loaded
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const NotificationController = require('./controllers/NotificationController');
const AuthController = require('./controllers/AuthController');
const UserController = require('./controllers/UserController');
const ApplicationController = require('./controllers/ApplicationController');
const DocumentController = require('./controllers/DocumentController');
const DocumentUploadController = require('./controllers/DocumentUploadController');
const RoleController = require('./controllers/RoleController');
const EvaluationController = require('./controllers/EvaluationController');
const PersonalityTestController = require('./controllers/PersonalityTestController');
const DepartmentController = require("./controllers/DepartmentController");
const InterviewController = require("./controllers/InterviewController");

const AuditLogController = require('./controllers/AuditLogController');

const fileUtils = require('./utils/FileUtils');
const authenticate = require('./middleware/authenticate');
const checkPermission = require('./middleware/checkPermission');
const { checkApplicationAccess, uploadDocuments } = require('./middleware/documentMiddleware');
const { uploadDocumentsMiddleware } = require('./middleware/documentUploadMiddleware');
const User = require('./models/User');
const RoleService = require('./services/RoleService');
process.setMaxListeners(20);

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';
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

// CORS configuration for development
app.use(cors({
  origin: ['http://95.216.139.119:3001', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type','Access-Control-Allow-Origin', 'Authorization', 'Cookie'],
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
    
    // Initialize permissions, roles, and admin account
    try {
      console.log('Initializing permissions and roles...');
      await RoleService.initializePermissions();
      await RoleService.initializeRoles();
      await RoleService.initializeAdminAccount();
      console.log('System initialization completed successfully');
    } catch (initError) {
      console.error('System initialization error:', initError);
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to backend_nasm');
});

// Routes
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/logout', authenticate, AuthController.logout);
app.post('/api/auth/forgot-password/verify-email', AuthController.forgotPasswordVerifyEmail);
app.post('/api/auth/forgot-password/change-password', AuthController.forgotPasswordChangePassword);
app.get('/api/auth/me', authenticate, AuthController.getCurrentUser);
app.get('/api/auth/email/verify', AuthController.verifyEmail);
app.get('/api/auth/email/resend', AuthController.resendVerificationEmail);
app.put('/api/auth/email', authenticate, AuthController.updateEmail);

// User management routes (admin only)
app.post('/api/user', authenticate, checkPermission('user.create'), UserController.createUser);
app.get('/api/users/disabled', authenticate, checkPermission('user.read'), UserController.getDisabledUsers);
app.get('/api/users/deleted', authenticate, checkPermission('user.read'), UserController.getSoftDeletedUsers);
app.get('/api/users/idnumber/:idNumber', authenticate, checkPermission('user.read'), UserController.getUserByIdNumber);
app.get('/api/users', authenticate, checkPermission('user.read'), UserController.getAllUsers);
app.get('/api/users/:id', authenticate, checkPermission('user.read'), UserController.getUserById);
app.patch('/api/users/idnumber/:idNumber', authenticate, checkPermission('user.update'), UserController.updateUserByIdNumber);
app.patch('/api/users/:id', authenticate, checkPermission('user.update'), UserController.updateUser);
app.delete('/api/users/idnumber/:idNumber', authenticate, checkPermission('user.delete'), UserController.deleteUserByIdNumber);
app.delete('/api/users/:id', authenticate, checkPermission('user.delete'), UserController.deleteUser);

// User disable/enable routes
app.patch('/api/users/:id/disable', authenticate, checkPermission('user.update'), UserController.disableUser);
app.patch('/api/users/:id/enable', authenticate, checkPermission('user.update'), UserController.enableUser);
app.patch('/api/users/idnumber/:idNumber/disable', authenticate, checkPermission('user.update'), UserController.disableUserByIdNumber);
app.patch('/api/users/idnumber/:idNumber/enable', authenticate, checkPermission('user.update'), UserController.enableUserByIdNumber);

// User soft delete routes
app.delete('/api/users/:id/soft', authenticate, checkPermission('user.delete'), UserController.deleteUser);
app.put('/api/users/:id/restore', authenticate, checkPermission('user.delete'), UserController.restoreUser);
app.delete('/api/users/:id/permanent', authenticate, checkPermission('user.delete'), UserController.permanentDeleteUser);

// Role routes
app.post('/api/roles', authenticate, checkPermission('role.create'), RoleController.createRole);
app.get('/api/roles', authenticate, checkPermission('role.read'), RoleController.getAllRoles);
app.get('/api/roles/:id', authenticate, checkPermission('role.read.id'), RoleController.getRoleById);
app.patch('/api/roles/:id', authenticate, checkPermission('role.update'), RoleController.updateRole);
app.delete('/api/roles/:id', authenticate, checkPermission('role.delete'), RoleController.deleteRole);

// Role soft delete routes
app.delete('/api/roles/:id/soft', authenticate, checkPermission('role.delete'), RoleController.softDeleteRole);
app.put('/api/roles/:id/restore', authenticate, checkPermission('role.delete'), RoleController.restoreRole);
app.delete('/api/roles/:id/permanent', authenticate, checkPermission('role.delete'), RoleController.permanentDeleteRole);
app.get('/api/roles/deleted', authenticate, checkPermission('role.read'), RoleController.getSoftDeletedRoles);
app.get('/api/roles/deleted', authenticate, checkPermission('role.read'), RoleController.getSoftDeletedRoles);

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

// Application soft delete routes
app.delete('/api/application/:id/soft', authenticate, checkPermission('applicationForm.delete'), ApplicationController.softDeleteApplication);
app.put('/api/application/:id/restore', authenticate, checkPermission('applicationForm.delete'), ApplicationController.restoreApplication);
app.delete('/api/application/:id/permanent', authenticate, checkPermission('applicationForm.delete'), ApplicationController.permanentDeleteApplication);
app.get('/api/applications/deleted', authenticate, checkPermission('applicationForm.read'), ApplicationController.getSoftDeletedApplications);

// Application History routes
app.get('/api/application/history', authenticate, checkPermission('applicationHistory.readOwn'), ApplicationController.getMyApplicationHistory);
app.get('/api/application/history/user/:userId', authenticate, checkPermission('applicationHistory.read'), ApplicationController.getApplicationHistoryByUserId);
app.get('/api/application/history/:id', authenticate, checkPermission('applicationHistory.read'), ApplicationController.getApplicationHistoryById);

// Document routes
app.put('/api/documents', authenticate, checkPermission('document.set'), uploadDocuments, DocumentController.uploadDocuments);
app.get('/api/documents', authenticate, checkPermission('document.get'), DocumentController.getDocuments);
app.delete('/api/documents', authenticate, checkPermission('document.delete'), DocumentController.deleteDocuments);

// Document soft delete routes
app.delete('/api/documents/:id/soft', authenticate, checkPermission('document.delete'), DocumentController.softDeleteDocument);
app.put('/api/documents/:id/restore', authenticate, checkPermission('document.delete'), DocumentController.restoreDocument);
app.delete('/api/documents/:id/permanent', authenticate, checkPermission('document.delete'), DocumentController.permanentDeleteDocument);
app.get('/api/documents/deleted', authenticate, checkPermission('document.read'), DocumentController.getSoftDeletedDocuments);

// DocumentUpload routes (enhanced document management)
app.post('/api/document-uploads', authenticate, uploadDocumentsMiddleware, DocumentUploadController.uploadDocuments);
app.get('/api/document-uploads', authenticate, DocumentUploadController.getDocuments);
app.get('/api/document-uploads/all', authenticate, checkPermission('document.read'), DocumentUploadController.getAllDocuments);
app.get('/api/document-uploads/user/:userId', authenticate, checkPermission('document.read'), DocumentUploadController.getDocumentsByUserId);
app.patch('/api/document-uploads/:userId', authenticate, uploadDocumentsMiddleware, DocumentUploadController.updateDocument);
app.delete('/api/document-uploads/:userId', authenticate, DocumentUploadController.deleteDocument);

// End term semester grade specific routes
app.post('/api/document-uploads/end-term-grade', authenticate, uploadDocumentsMiddleware, checkPermission('document.upload.endTermGrade'),DocumentUploadController.addEndTermSemesterGrade);
app.patch('/api/document-uploads/:userId/end-term-grade/:gradeId', authenticate, uploadDocumentsMiddleware, checkPermission('document.upload.endTermGrade'), DocumentUploadController.updateEndTermSemesterGrade);

// DocumentUpload soft delete routes
app.delete('/api/document-uploads/:userId/soft', authenticate, checkPermission('document.delete'), DocumentUploadController.softDeleteDocument);
app.put('/api/document-uploads/:userId/restore', authenticate, checkPermission('document.delete'), DocumentUploadController.restoreDocument);
app.delete('/api/document-uploads/:userId/permanent', authenticate, checkPermission('document.delete'), DocumentUploadController.permanentDeleteDocument);
app.get('/api/document-uploads/deleted', authenticate, checkPermission('document.read'), DocumentUploadController.getSoftDeletedDocuments);

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

// Soft delete routes for personality tests
app.delete('/api/personality-test/:id/soft', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.softDeletePersonalityTest);
app.put('/api/personality-test/:id/restore', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.restorePersonalityTest);
app.delete('/api/personality-test/:id/permanent', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.permanentDeletePersonalityTest);
app.get('/api/personality-test/deleted', authenticate, checkPermission('personality_test.read'), PersonalityTestController.getSoftDeletedPersonalityTests);

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

// Soft delete routes for interviews
app.delete('/api/interview/:id/soft', authenticate, checkPermission('interview.delete'), InterviewController.softDeleteInterview);
app.put('/api/interview/:id/restore', authenticate, checkPermission('interview.delete'), InterviewController.restoreInterview);
app.delete('/api/interview/:id/permanent', authenticate, checkPermission('interview.delete'), InterviewController.permanentDeleteInterview);
app.get('/api/interviews/deleted', authenticate, checkPermission('interview.read'), InterviewController.getSoftDeletedInterviews);

// Review Routes - Interview-based reviews with application and document data
app.get('/api/review/:interviewId', authenticate, checkPermission('interview.readOwn'), InterviewController.getReviewByInterviewId);
app.get('/api/review', authenticate, checkPermission('interview.readOwn'), InterviewController.getReviewList);


// Evaluation Routes
app.post('/api/evaluations', authenticate, checkPermission('evaluation.create'), EvaluationController.createEvaluation);
app.get('/api/evaluations', authenticate, checkPermission('evaluation.read'), EvaluationController.getAllEvaluations);
app.get('/api/evaluations/:id', authenticate, checkPermission('evaluation.read'), EvaluationController.getEvaluationById);
app.patch('/api/evaluations/:id', authenticate, checkPermission('evaluation.update'), EvaluationController.updateEvaluation);
app.delete('/api/evaluations/:id', authenticate, checkPermission('evaluation.delete'), EvaluationController.deleteEvaluation);

// Soft delete routes for evaluations
app.delete('/api/evaluations/:id/soft', authenticate, checkPermission('evaluation.delete'), EvaluationController.softDeleteEvaluation);
app.put('/api/evaluations/:id/restore', authenticate, checkPermission('evaluation.delete'), EvaluationController.restoreEvaluation);
app.delete('/api/evaluations/:id/permanent', authenticate, checkPermission('evaluation.delete'), EvaluationController.permanentDeleteEvaluation);
app.get('/api/evaluations/deleted', authenticate, checkPermission('evaluation.read'), EvaluationController.getSoftDeletedEvaluations);
app.patch('/api/evaluations/:id/timekeeping', authenticate, checkPermission('evaluation.update_timekeeping'), EvaluationController.updateTimeKeepingRecord);
app.get('/api/evaluations/:id/timekeeping', authenticate, checkPermission('evaluation.read_timekeeping'), EvaluationController.getTimeKeepingRecord);

// Department Routes
app.post('/api/departments', authenticate, checkPermission('department.create'), DepartmentController.createDepartment);
app.get('/api/departments', authenticate, checkPermission('department.read'), DepartmentController.getAllDepartments);
app.get('/api/departments/:departmentCode', authenticate, checkPermission('department.read'), DepartmentController.getDepartmentByCode);
app.patch('/api/departments/:departmentCode', authenticate, checkPermission('department.update'), DepartmentController.updateDepartment);
app.delete('/api/departments/:departmentCode', authenticate, checkPermission('department.delete'), DepartmentController.deleteDepartment);

// Soft delete routes for departments
app.delete('/api/departments/:departmentCode/soft', authenticate, checkPermission('department.delete'), DepartmentController.softDeleteDepartment);
app.put('/api/departments/:departmentCode/restore', authenticate, checkPermission('department.delete'), DepartmentController.restoreDepartment);
app.delete('/api/departments/:departmentCode/permanent', authenticate, checkPermission('department.delete'), DepartmentController.permanentDeleteDepartment);
app.get('/api/departments/deleted', authenticate, checkPermission('department.read'), DepartmentController.getSoftDeletedDepartments);

// Department Head Management Routes (use null values to remove head)
app.post('/api/departments/:departmentCode/head/id', authenticate, checkPermission('department.update'), DepartmentController.setDepartmentHeadById);
app.post('/api/departments/:departmentCode/head/idnumber', authenticate, checkPermission('department.update'), DepartmentController.setDepartmentHeadByIdNumber);

// File download route
app.get('/api/files/:fileName', authenticate, checkPermission('document.get'), async (req, res) => {
  await fileUtils.downloadFile(req.params.fileName, req, res);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof mongoose.MulterError) {
    return res.status(400).json({ message: `File upload error: ${err.message}` });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});


// Activity history routes
app.get('/api/activity/history', authenticate, ApplicationController.getMyActivityHistory);
app.get('/api/activity/history/user/:userId', authenticate, checkPermission('activity.readAll'), ApplicationController.getUserActivityHistory);

// Notification routes
app.post('/api/notifications', authenticate, NotificationController.createNotification);
app.get('/api/notifications', authenticate, NotificationController.getUserNotifications);
app.patch('/api/notifications/:notificationId/read', authenticate, NotificationController.markAsRead);
app.patch('/api/notifications/mark-all-read', authenticate, NotificationController.markAllAsRead);
app.delete('/api/notifications/:notificationId', authenticate, NotificationController.deleteNotification);
app.delete('/api/notifications', authenticate, NotificationController.deleteAllNotifications);

// Soft delete routes for notifications
app.delete('/api/notifications/:notificationId/soft', authenticate, NotificationController.softDeleteNotification);
app.put('/api/notifications/:notificationId/restore', authenticate, NotificationController.restoreNotification);
app.delete('/api/notifications/:notificationId/permanent', authenticate, NotificationController.permanentDeleteNotification);
app.get('/api/notifications/deleted', authenticate, NotificationController.getSoftDeletedNotifications);

// Add this test route temporarily
app.get('/api/notifications-test', (req, res) => {
  res.json({ message: 'Notification route is working!' });
});

// Add this temporarily for testing
app.get('/api/test-notifications', (req, res) => {
  console.log('Test notification route hit!');
  res.json({ message: 'Notification route is working!' });
});

// Add this simple test route
app.get('/api/test-notification', (req, res) => {
  res.json({ message: 'Test notification route works!' });
});

// OAS Staff Dashboard Routes
app.get('/api/oas/applications', authenticate, checkPermission('applicationForm.read'), ApplicationController.getAllApplicationsForStaff);
app.get('/api/oas/application/:applicationId/documents', authenticate, ApplicationController.getApplicationDocumentsByAppId);
app.patch('/api/oas/application/:applicationId/status', authenticate, checkPermission('applicationForm.update'), ApplicationController.updateApplicationStatus);
app.get('/api/oas/application-by-id/:applicationId/pdf', authenticate, ApplicationController.exportApplicationFormAsPDFByApplicationId);
// Delete application route for OAS staff
app.delete('/api/oas/application/:applicationId', authenticate, checkPermission('applicationForm.delete'), ApplicationController.deleteApplicationById);
// Delete only application form (keep documents)
app.delete('/api/oas/application/:applicationId/form-only', authenticate, checkPermission('applicationForm.delete'), ApplicationController.deleteApplicationFormOnly);

// Delete only documents (keep application form)
app.delete('/api/oas/application/:applicationId/documents-only', authenticate, checkPermission('applicationForm.delete'), ApplicationController.deleteDocumentsOnly);

// OAS Soft delete routes for applications
app.delete('/api/oas/application/:applicationId/soft', authenticate, checkPermission('applicationForm.delete'), ApplicationController.softDeleteApplication);
app.put('/api/oas/application/:applicationId/restore', authenticate, checkPermission('applicationForm.delete'), ApplicationController.restoreApplication);
app.delete('/api/oas/application/:applicationId/permanent', authenticate, checkPermission('applicationForm.delete'), ApplicationController.permanentDeleteApplication);
app.get('/api/oas/applications/deleted', authenticate, checkPermission('applicationForm.read'), ApplicationController.getSoftDeletedApplications);

// Application verification routes
app.patch('/api/oas/application/:applicationId/verify', authenticate, ApplicationController.verifyApplicationForm);
app.patch('/api/oas/application/:applicationId/verify-documents', authenticate, ApplicationController.verifyApplicationDocuments);

// Test routes (can be removed in production)
app.get('/api/test-verify', (req, res) => {
  res.json({ message: 'Route is working!' });
});

// Dashboard stats route
app.get('/api/oas/dashboard-stats', authenticate, checkPermission('applicationForm.read'), ApplicationController.getDashboardStats);
// Application counts route for OAS staff
app.get('/api/oas/application-counts', authenticate, checkPermission('applicationForm.read'), ApplicationController.getApplicationCounts);
// Analytics endpoint for OAS staff (applications overview & charts)
app.get('/api/oas/analytics', authenticate, checkPermission('applicationForm.read'), ApplicationController.getAnalytics);

// Department Head: Schedule interview with notification
app.post('/api/department-head/interview/schedule', authenticate, checkPermission('application.readAll'), InterviewController.createInterviewForApplicant);
app.patch('/api/department-head/interview/:interviewId/reschedule', authenticate, checkPermission('application.readAll'), InterviewController.rescheduleInterviewForDepartmentHead);

// Graceful shutdown
const server = app.listen(port,host, () => {
  console.log(`Server running at http://${host}:${port}`);
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
