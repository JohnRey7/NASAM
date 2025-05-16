require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const AuthController = require('./controllers/AuthController');
const authenticate = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas (nasm_database)'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/logout', AuthController.logout);
app.get('/api/auth/me', authenticate, AuthController.getCurrentUser);
app.get('/api/auth/email/verify', AuthController.verifyEmail);
app.get('/api/auth/email/resend', AuthController.resendVerificationEmail);
app.put('/api/auth/email', authenticate, AuthController.updateEmail);

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
