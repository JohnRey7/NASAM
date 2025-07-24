const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const Role = require('../models/Role');
const Department = require('../models/Department');
const BlacklistedToken = require('../models/BlacklistedToken');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

// Helper: Generate a 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Generate a JWT token for a user
function generateToken(user) {
  if (!user.role) {
    throw new Error('User role is missing or invalid');
  }
  const payload = { 
    id: user._id, 
    idNumber: user.idNumber, 
    role: user.role._id,
    roleName: user.role.name
  };
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
  async login(req, res) {
    try {
      const { idNumber, password, rememberMe } = req.body;
      if (!idNumber || !password) {
        return res.status(400).json({ message: 'ID number and password are required' });
      }

      const user = await User.findOne({ idNumber }).populate('role');
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.role) {
        return res.status(500).json({ message: 'User role is missing. Please contact administrator.' });
      }

      if (user.disabled) {
        return res.status(403).json({ message: 'Account is disabled' });
      }

      if (user.email && !user.verified) {
        return res.status(403).json({ message: 'Please verify your email before logging in' });
      }

      const isMatch = await argon2.verify(user.password, password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

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
          role: { 
            id: user.role._id, 
            name: user.role.name 
          }
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
        return res.status(400).json({ message: 'Name, ID number, password, course ID, and are required' });
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

      const role = await Role.findOne( { name: "applicant"} );
      if (!role) {
        return res.status(400).json({ message: 'Invalid role ID' });
      }

      const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
      const user = new User({ 
        name, 
        idNumber, 
        email, 
        password: hashedPassword, 
        course: course._id,
        role: role._id 
      });

      if (email) {
        const code = updateVerificationDetails(user);
        await sendVerificationEmail(user.email, code);
      }

      await user.save();

      const token = generateToken({ ...user._doc, role });
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
          role: { 
            id: role._id, 
            name: role.name 
          }
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async registerDepartmentHead(req, res) {
    try {
      const { name, idNumber, email, password, departmentCode, rememberMe } = req.body;
      if (!name || !idNumber || !password || !departmentCode) {
        return res.status(400).json({ message: 'Name, ID number, password, and department code are required' });
      }

      if (await User.findOne({ idNumber })) {
        return res.status(400).json({ message: 'ID number already exists' });
      }
      if (email && (await User.findOne({ email }))) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      console.log('Department Head registration attempt:', { name, idNumber, email, departmentCode });
      
      // Find the department by departmentCode
      const departmentDoc = await Department.findOne({ departmentCode });
      if (!departmentDoc) {
        console.log('Department not found:', departmentCode);
        return res.status(400).json({ message: 'Invalid department code' });
      }

      // Find the department head role
      const role = await Role.findOne({ name: "department_head" });
      if (!role) {
        return res.status(400).json({ message: 'Department head role not found' });
      }

      const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
      const user = new User({ 
        name, 
        idNumber, 
        email, 
        password: hashedPassword, 
        department: departmentDoc._id,
        role: role._id 
      });

      // If email is provided, do not require verification for department head
      if (email) {
        user.verified = true;
        // No verification email sent
      }

      await user.save();

      // Remove rememberMe and cookie logic for admin registration
      // const token = generateToken({ ...user._doc, role });
      // const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      // res.cookie('jwt', token, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === 'production',
      //   sameSite: 'strict',
      //   maxAge,
      //   path: '/',
      // });

      return res.status(201).json({
        message: email ? 'Department head registration successful. This account was created by an admin. Please verify the email.' : 'Department head registration successful. This account was created by an admin.',
        adminRegistered: true,
        user: { 
          id: user._id, 
          idNumber: user.idNumber, 
          department: {
            id: departmentDoc._id,
            code: departmentDoc.departmentCode,
            name: departmentDoc.name
          },
          role: { 
            id: role._id, 
            name: role.name 
          }
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

      const user = await User.findOne({ 'emailVerification.code': code }).populate('role');
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
        user.email = pendingEmail;
        user.emailVerification.pendingEmail = null;
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

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id; // Assumes JWT middleware sets req.user

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required' });
      }

      // Validate new password strength (example: minimum 8 characters)
      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.disabled) {
        return res.status(403).json({ message: 'Account is disabled' });
      }

      const isMatch = await argon2.verify(user.password, currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Prevent reuse of same password
      if (await argon2.verify(user.password, newPassword)) {
        return res.status(400).json({ message: 'New password cannot be the same as current password' });
      }

      user.password = await argon2.hash(newPassword, { type: argon2.argon2id });
      await user.save();

      // Invalidate current JWT by blacklisting it
      const token = req.cookies.jwt;
      if (token) {
        await new BlacklistedToken({ token }).save();
        res.clearCookie('jwt', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
      }

      return res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async getCurrentUser(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .select('-password -emailVerification')
        .populate({
          path: 'course',
          select: 'courseId name'
        })
        .populate({
          path: 'role',
          populate: {
            path: 'permissions',
            select: 'name'
          }
        });
      
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
          email: user.email,
          course: user.course,
          role: {
            id: user.role._id,
            name: user.role.name,
            permissions: user.role.permissions.map(p => ({
              id: p._id,
              name: p.name
            }))
          }
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify current password
      const isMatch = await argon2.verify(user.password, currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });
      user.password = hashedPassword;
      await user.save();

      // Invalidate all existing sessions
      const token = req.cookies.jwt;
      if (token) {
        await new BlacklistedToken({ token }).save();
      }
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = AuthController;