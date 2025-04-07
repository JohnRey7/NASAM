require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const AuthController = require('./controllers/AuthController');
const authenticate = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB Connection (ensure database is nasm_database)
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas (nasm_database)'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/auth/login', AuthController.login);
app.post('/api/auth/register', AuthController.register);
app.post('/api/auth/logout', AuthController.logout);

// Email verification
app.post('/api/auth/email/verify', authenticate, AuthController.verifyEmail);
app.post('/api/auth/email/resend', authenticate, AuthController.resendVerificationEmail);
app.put('/api/auth/email', authenticate, AuthController.updateEmail);

// Basic route
app.get('/', (req, res) => {
    res.send('Welcome to backend_nasm');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

