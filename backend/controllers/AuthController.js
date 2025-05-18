const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const BlacklistedToken = require('../models/BlacklistedToken');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

// Helper: Generate a 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Generate a JWT token for a user
function generateToken(user) {
  const payload = { id: user._id, idNumber: user.idNumber, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// Helper: Update a user's verification details
function updateVerificationDetails(user, pendingEmail = null) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.verified = false;
  user.emailVerification = {
    code,
    expiresAt,
    lastSentAt: new Date(),
    verified: false,
    pendingEmail: pendingEmail || null,
  };

  return code;
}

const AuthController = {
    async login(req, res) {    try {      const { idNumber, password, rememberMe } = req.body;      if (!idNumber || !password) {        return res.status(400).json({ message: 'ID number and password are required' });      }      const user = await User.findOne({ idNumber });      if (!user) {        return res.status(401).json({ message: 'Please log in with your user credentials.' });      }      if (user.disabled) {        return res.status(403).json({ message: 'Account is disabled' });      }      if (user.email && !user.verified) {        return res.status(403).json({ message: 'Please verify your email before logging in' });      }      const isMatch = await argon2.verify(user.password, password);      if (!isMatch) {        return res.status(401).json({ message: 'Please log in with your user credentials.' });      }

      const token = generateToken(user);
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge,
        path: '/',
      });

      return res.json({
        message: 'Login successful',
        user: { 
          id: user._id, 
          idNumber: user.idNumber, 
          name: user.name,
          role: user.role 
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async register(req, res) {
    try {
      const { name, idNumber, email, password, courseId, rememberMe } = req.body;
      if (!name || !idNumber || !password || !courseId) {
        return res.status(400).json({ message: 'Name, ID number, password, and course ID are required' });
      }

      if (await User.findOne({ idNumber })) {
        return res.status(400).json({ message: 'ID number already exists' });
      }
      if (email && (await User.findOne({ email }))) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      console.log('Registration attempt:', { name, idNumber, email, courseId });
      
      // Find the course by ID
      const course = await Course.findOne({ courseId });
      if (!course) {
        console.log('Course not found:', courseId);
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      console.log('Found course:', course);

      // Make sure name is not the same as idNumber
      let finalName = name;
      if (name === idNumber || !name) {
        finalName = `Student ${idNumber}`;
        console.log('Using default name:', finalName);
      }
      
      const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
      const user = new User({ 
        name: finalName, 
        idNumber, 
        email, 
        password: hashedPassword, 
        course: course._id 
      });

      if (email) {
        const code = updateVerificationDetails(user);
        await sendVerificationEmail(user.email, code);
      }

      await user.save();

      const token = generateToken(user);
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge,
        path: '/',
      });

      return res.status(201).json({
        message: email ? 'Registration successful, please verify your email.' : 'Registration successful',
        user: { 
          id: user._id, 
          idNumber: user.idNumber, 
          name: user.name,
          role: user.role 
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async logout(req, res) {
    try {
      const token = req.cookies.jwt;
      if (!token) {
        return res.status(400).json({ message: 'No token provided' });
      }

      if (await BlacklistedToken.findOne({ token })) {
        return res.status(400).json({ message: 'Token already invalidated' });
      }

      await new BlacklistedToken({ token }).save();
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ message: 'Verification code is required' });
      }

      const user = await User.findOne({ 'emailVerification.code': code });
      if (!user || !user.emailVerification) {
        return res.status(400).json({ message: 'Invalid or unknown verification code' });
      }

      if (user.verified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      const { code: storedCode, expiresAt, pendingEmail } = user.emailVerification;
      if (code !== storedCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
      if (Date.now() > new Date(expiresAt).getTime()) {
        return res.status(400).json({ message: 'Verification code expired' });
      }

      user.emailVerification.verified = true;
      user.verified = true;
      if (pendingEmail) {
        user.email = pendingEmail; // Apply new email
        user.emailVerification.pendingEmail = null; // Clear pending
      }
      await user.save();

      return res.redirect('http://localhost:3000/verified');
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async resendVerificationEmail(req, res) {
    try {
      const { idNumber } = req.query;
      if (!idNumber) {
        return res.status(400).json({ message: 'ID number is required' });
      }

      const user = await User.findOne({ idNumber });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (!user.email && !user.emailVerification?.pendingEmail) {
        return res.status(400).json({ message: 'No email associated with this account' });
      }
      if (user.verified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      const now = Date.now();
      const lastSent = user.emailVerification?.lastSentAt?.getTime() || 0;
      const cooldown = 5 * 60 * 1000;

      if (now - lastSent < cooldown) {
        const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
        return res.status(429).json({ message: `Please wait ${wait}s before resending.` });
      }

      const code = generateVerificationCode();
      const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
      user.emailVerification = {
        ...user.emailVerification,
        code,
        expiresAt,
        lastSentAt: new Date(),
        verified: false,
      };

      await user.save();
      const targetEmail = user.emailVerification.pendingEmail || user.email;
      await sendVerificationEmail(targetEmail, code);
      return res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async updateEmail(req, res) {
    try {
      const { idNumber, email } = req.body;
      if (!idNumber || !email) {
        return res.status(400).json({ message: 'ID number and email are required' });
      }

      const user = await User.findOne({ idNumber });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      const now = Date.now();
      const lastSent = user.emailVerification?.lastSentAt?.getTime() || 0;
      const cooldown = 5 * 60 * 1000;

      if (now - lastSent < cooldown) {
        const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
        return res.status(429).json({ message: `Please wait ${wait}s before updating email.` });
      }

      const code = updateVerificationDetails(user, email);
      await user.save();
      await sendVerificationEmail(email, code);

      return res.json({ message: 'Verification email sent to new email.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .select('-password -emailVerification')
        .populate('course', 'courseId name');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.disabled) {
        return res.status(403).json({ message: 'Account is disabled' });
      }
      return res.json({
        user: {
          id: user._id,
          idNumber: user.idNumber,
          name: user.name,
          role: user.role,
          course: user.course,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = AuthController;