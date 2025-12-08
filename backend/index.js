// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: envFile });

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
const fileUtils = require('./utils/FileUtils');
const authenticate = require('./middleware/authenticate');
const checkPermission = require('./middleware/checkPermission');
const RoleService = require('./services/RoleService');
const UserController = require('./controllers/UserController'); // Needed for singular /api/user route

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const documentRoutes = require('./routes/documentRoutes');
const documentUploadRoutes = require('./routes/documentUploadRoutes');
const documentByIdRoutes = require('./routes/documentByIdRoutes');
const personalityTestRoutes = require('./routes/personalityTestRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const oasRoutes = require('./routes/oasRoutes');
const scholarEvaluationRoutes = require('./routes/scholarEvaluationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentHeadRoutes = require('./routes/departmentHeadRoutes');

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

// CORS configuration for production and development
const allowedOrigins = [
  'http://95.216.139.119:3001',
  'http://localhost:3001', 
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In production, be more strict
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow any origin
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Access-Control-Allow-Origin', 
    'Authorization', 
    'Cookie',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['Set-Cookie', 'Content-Disposition', 'Content-Length', 'Content-Type'],
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

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// Compatibility route for creating user (singular)
app.post('/api/user', authenticate, checkPermission('user.create'), UserController.createUser);

app.use('/api/roles', roleRoutes);
app.use('/api/application', applicationRoutes);
// Support plural for frontend compatibility
app.use('/api/applications', applicationRoutes); 

app.use('/api/documents', documentRoutes);
app.use('/api/document-uploads', documentUploadRoutes);
app.use('/api/document', documentByIdRoutes);
app.use('/api/personality-test', personalityTestRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/interviews', interviewRoutes); // Support plural
app.use('/api/review', reviewRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/evaluation', evaluationRoutes); // Support singular
app.use('/api/departments', departmentRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/oas', oasRoutes);
app.use('/api', scholarEvaluationRoutes); // These routes are mixed, some start with /api/evaluation-period, some /api/scholar-evaluation
app.use('/api/admin', adminRoutes);
app.use('/api/department-head', departmentHeadRoutes);

// File download route
app.get('/api/files/:fileName', authenticate, checkPermission('document.get'), async (req, res) => {
  await fileUtils.downloadFile(req.params.fileName, req, res);
});

// Test routes
app.get('/api/test-verify', (req, res) => {
  res.json({ message: 'Route is working!' });
});
app.get('/api/notifications-test', (req, res) => {
  res.json({ message: 'Notification route is working!' });
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
