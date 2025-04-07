const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

// Helper: Generate a 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Generate a JWT token for a user
function generateToken(user) {
  const payload = { id: user._id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
}

// Helper: Update a user's verification details (optionally updating the email)
// Returns the generated verification code.
function updateVerificationDetails(user, newEmail = null) {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1-day expiry

  if (newEmail) {
    user.email = newEmail;
  }

  user.verified = false;
  user.emailVerification = {
    code,
    expiresAt,
    lastSentAt: new Date(),
    verified: false,
  };

  return code;
}

const AuthController = {
  // 1.1 Login
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await argon2.verify(user.password, password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      return res.json({
        message: 'Login successful',
        token,
        user: { id: user._id, email: user.email, role: user.role }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // 1.2 Registration
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Check if email already exists
      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
      const user = new User({ name, email, password: hashedPassword });

      // Set verification details and send email
      const code = updateVerificationDetails(user);
      await user.save();
      await sendVerificationEmail(user.email, code);

      const token = generateToken(user);
      return res.status(201).json({
        message: 'Registration successful, please verify your email.',
        token,
        user: { id: user._id, email: user.email }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // 1.3 Logout
  async logout(req, res) {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(400).json({ message: 'No token provided' });
      }

      if (await BlacklistedToken.findOne({ token })) {
        return res.status(400).json({ message: 'Token already invalidated' });
      }

      await new BlacklistedToken({ token }).save();
      return res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // 1.4 Verify Email
  async verifyEmail(req, res) {
    try {
      const { code } = req.body;
      const userId = req.user?.id;
      const user = await User.findById(userId);

      if (!user || !user.emailVerification) {
        return res.status(400).json({ message: 'Verification not requested' });
      }

      if (user.verified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      const { code: storedCode, expiresAt } = user.emailVerification;
      if (code !== storedCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
      if (Date.now() > new Date(expiresAt).getTime()) {
        return res.status(400).json({ message: 'Verification code expired' });
      }

      user.emailVerification.verified = true;
      user.verified = true;
      await user.save();

      return res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // 1.5 Resend Verification Email
  async resendVerificationEmail(req, res) {
    try {
      const userId = req.user?.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.verified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      const now = Date.now();
      const lastSent = user.emailVerification?.lastSentAt?.getTime() || 0;
      const cooldown = 5 * 60 * 1000; // 5 minutes

      if (now - lastSent < cooldown) {
        const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
        return res.status(429).json({ message: `Please wait ${wait}s before resending.` });
      }

      // Update verification details and resend email
      const code = generateVerificationCode();
      const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
      user.emailVerification = {
        code,
        expiresAt,
        lastSentAt: new Date(),
        verified: false
      };

      await user.save();
      await sendVerificationEmail(user.email, code);
      return res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // 1.6 Update Email
  async updateEmail(req, res) {
    try {
      const userId = req.user?.id;
      const { email } = req.body;

      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update verification details with the new email
      const code = updateVerificationDetails(user, email);
      await user.save();
      await sendVerificationEmail(user.email, code);

      return res.json({ message: 'Email updated. Verification sent.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = AuthController;

