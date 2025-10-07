const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const Role = require('../models/Role');
const Department = require('../models/Department');
const BlacklistedToken = require('../models/BlacklistedToken');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const validatePassword = require('../utils/validatePassword');
const AuditLogService = require('../services/AuditLogService');
const sendPasswordResetEmail = require('../utils/sendPasswordResetEmail');
const PasswordResetToken = require('../models/PasswordResetToken');
const crypto = require('crypto');

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

      await AuditLogService.createLog({
        userId: user._id,
        action: 'User Login',
        module: 'Authentication',
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
        return res.status(400).json({ message: 'Name, ID number, password, and course ID are required' });
      }

      // ✅ Password rules check
      const { valid, message } = validatePassword(password);
      if (!valid) {
        return res.status(400).json({ message });
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
    const { name, idNumber, email, password, departmentCode } = req.body;
    console.log("[REGISTER] Incoming request:", { name, idNumber, email, departmentCode });

    // ✅ Check required fields
    if (!name || !idNumber || !password || !departmentCode) {
      console.warn("[REGISTER] Missing required fields");
      return res.status(400).json({ message: 'Name, ID number, password, and department code are required' });
    }

    // ✅ Password rules check
    const { valid, message } = validatePassword(password);
    console.log("[REGISTER] Password validation result:", { valid, message });
    if (!valid) {
      return res.status(400).json({ message });
    }

    // ✅ Check duplicates
    if (await User.findOne({ idNumber })) {
      console.warn("[REGISTER] Duplicate ID number:", idNumber);
      return res.status(400).json({ message: 'ID number already exists' });
    }
    if (email && (await User.findOne({ email }))) {
      console.warn("[REGISTER] Duplicate email:", email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    console.log("[REGISTER] Department Head registration attempt:", { name, idNumber, email, departmentCode });

    // ✅ Find department
    const departmentDoc = await Department.findOne({ departmentCode });
    console.log("[REGISTER] Department query result:", departmentDoc);
    if (!departmentDoc) {
      console.warn("[REGISTER] Department not found:", departmentCode);
      return res.status(400).json({ message: 'Invalid department code' });
    }

    // ✅ Find role
    const role = await Role.findOne({ name: "department_head" });
    console.log("[REGISTER] Role query result:", role);
    if (!role) {
      console.warn("[REGISTER] Department head role not found in DB");
      return res.status(400).json({ message: 'Department head role not found' });
    }

    // ✅ Hash password
    const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
    console.log("[REGISTER] Password hashed successfully");

    // ✅ Create user
    const user = new User({ 
      name, 
      idNumber, 
      email, 
      password: hashedPassword, 
      department: departmentDoc._id,
      role: role._id 
    });
    if (email) {
      user.verified = true; // Auto-verify for dept head
      console.log("[REGISTER] Email provided, auto-verified");
    }

    await user.save();
    console.log("[REGISTER] User saved successfully:", user._id);

    // ✅ Audit log
    if (req.user && req.user.id) {
      await AuditLogService.createLog({
        userId: req.user.id,   // the admin performing this action
        action: `Registered Department Head (${idNumber}) for department ${departmentDoc.departmentCode}`,
        module: 'User Management'
      });
      console.log("[REGISTER] Audit log created successfully");
    } else {
      console.warn("[REGISTER] No admin user found in req.user");
    }

    // ✅ Response
    console.log("[REGISTER] Registration success:", user._id);
    return res.status(201).json({
      message: email 
        ? 'Department head registration successful. This account was created by an admin. Please verify the email.' 
        : 'Department head registration successful. This account was created by an admin.',
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
    console.error("[REGISTER] Server error:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded JWT: ", decoded);
      
      await new BlacklistedToken({ token }).save();
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

     await AuditLogService.createLog({
        userId: decoded.id, 
        action: 'User Logout', 
        module: 'Authentication'
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
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }

      // ✅ Validate new password rules
      const { valid, message } = validatePassword(newPassword);
      if (!valid) {
        return res.status(400).json({ message });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await argon2.verify(user.password, currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      if (await argon2.verify(user.password, newPassword)) {
        return res.status(400).json({ message: 'New password cannot be the same as current password' });
      }

      const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });
      user.password = hashedPassword;
      await user.save();

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
          address: user.address || null,
          contact: user.contact || null,
          birthday: user.birthday || null,
          gender: user.gender || null,
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

  async updateProfile(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { name, idNumber, address, contact, birthday, gender } = req.body;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (name) user.name = name;
      if (idNumber) user.idNumber = idNumber;
      if (address !== undefined) user.address = address;
      if (contact !== undefined) user.contact = contact;
      if (birthday !== undefined) user.birthday = birthday;
      // Only allow 'Male' or 'Female' values; if undefined, do not change
      if (gender !== undefined) {
        if (gender === 'Male' || gender === 'Female') user.gender = gender;
        else return res.status(400).json({ message: 'Invalid gender value' });
      }

      await user.save();

      return res.json({ message: 'Profile updated', user: { id: user._id, name: user.name, idNumber: user.idNumber, email: user.email, gender: user.gender } });
    } catch (error) {
      console.error('updateProfile error', error);
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await new PasswordResetToken({
        userId: user._id,
        token: hashedToken,
        expiresAt,
      }).save();

      await sendPasswordResetEmail(user.email, resetToken);

      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Forgot Password Error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const resetTokenDoc = await PasswordResetToken.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() },
      });

      if (!resetTokenDoc) {
        return res.status(400).json({ message: 'Invalid or expired password reset token' });
      }

      const user = await User.findById(resetTokenDoc.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.password = await argon2.hash(newPassword, { type: argon2.argon2id });
      await user.save();

      await PasswordResetToken.findByIdAndDelete(resetTokenDoc._id);

      const currentJwt = req.cookies.jwt;
      if (currentJwt) {
        await new BlacklistedToken({ token: currentJwt }).save();
        res.clearCookie('jwt');
      }

      return res.json({ message: 'Password has been reset successfully. Please log in with your new password.' });
    } catch (error) {
      console.error('Reset Password Error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = AuthController;

