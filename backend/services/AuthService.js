const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const Role = require('../models/Role');
const Department = require('../models/Department');
const BlacklistedToken = require('../models/BlacklistedToken');
const sendVerificationEmail = require('../utils/sendVerificationEmail');

class AuthService {
  // Helper: Generate a 6-digit verification code
  static generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Helper: Generate a JWT token for a user
  static generateToken(user) {
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
  static updateVerificationDetails(user, pendingEmail = null) {
    const code = this.generateVerificationCode();
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

  // Login user
  static async login(idNumber, password) {
    if (!idNumber || !password) {
      throw new Error('ID number and password are required');
    }

    const user = await User.findOne({ idNumber }).populate('role');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.role) {
      throw new Error('User role is missing. Please contact administrator.');
    }

    if (user.disabled) {
      throw new Error('Account is disabled');
    }

    if (user.email && !user.verified) {
      throw new Error('Please verify your email before logging in');
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user);
    
    return {
      token,
      user: { 
        id: user._id, 
        idNumber: user.idNumber, 
        role: { 
          id: user.role._id, 
          name: user.role.name 
        }
      }
    };
  }

  // Register applicant
  static async register(name, idNumber, email, password, courseId) {
    if (!name || !idNumber || !password || !courseId) {
      throw new Error('Name, ID number, password, and course ID are required');
    }

    if (await User.findOne({ idNumber })) {
      throw new Error('ID number already exists');
    }
    if (email && (await User.findOne({ email }))) {
      throw new Error('Email already exists');
    }

    console.log('Registration attempt:', { name, idNumber, email, courseId });
    
    // Find the course by ID
    const course = await Course.findOne({ courseId });
    if (!course) {
      console.log('Course not found:', courseId);
      throw new Error('Invalid course ID');
    }

    const role = await Role.findOne({ name: "applicant" });
    if (!role) {
      throw new Error('Applicant role not found');
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

    let verificationMessage = '';
    if (email) {
      const code = this.updateVerificationDetails(user);
      await sendVerificationEmail(user.email, code);
      verificationMessage = ', please verify your email.';
    }

    await user.save();

    const token = this.generateToken({ ...user._doc, role });
    
    return {
      token,
      message: `Registration successful${verificationMessage}`,
      user: { 
        id: user._id, 
        idNumber: user.idNumber, 
        role: { 
          id: role._id, 
          name: role.name 
        }
      }
    };
  }

  // Register department head
  static async registerDepartmentHead(name, idNumber, email, password, departmentCode) {
    if (!name || !idNumber || !password || !departmentCode) {
      throw new Error('Name, ID number, password, and department code are required');
    }

    if (await User.findOne({ idNumber })) {
      throw new Error('ID number already exists');
    }
    if (email && (await User.findOne({ email }))) {
      throw new Error('Email already exists');
    }

    console.log('Department Head registration attempt:', { name, idNumber, email, departmentCode });
    
    // Find the department by departmentCode
    const departmentDoc = await Department.findOne({ departmentCode });
    if (!departmentDoc) {
      console.log('Department not found:', departmentCode);
      throw new Error('Invalid department code');
    }

    // Find the department head role
    const role = await Role.findOne({ name: "department_head" });
    if (!role) {
      throw new Error('Department head role not found');
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
    }

    await user.save();

    return {
      message: email ? 
        'Department head registration successful. This account was created by an admin. Please verify the email.' : 
        'Department head registration successful. This account was created by an admin.',
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
      }
    };
  }

  // Logout user
  static async logout(token) {
    if (!token) {
      throw new Error('No token provided');
    }

    if (await BlacklistedToken.findOne({ token })) {
      throw new Error('Token already invalidated');
    }

    await new BlacklistedToken({ token }).save();
    return { message: 'Logout successful' };
  }

  // Verify email
  static async verifyEmail(code) {
    if (!code) {
      throw new Error('Verification code is required');
    }

    const user = await User.findOne({ 'emailVerification.code': code }).populate('role');
    if (!user || !user.emailVerification) {
      throw new Error('Invalid or unknown verification code');
    }

    if (user.verified) {
      throw new Error('Email is already verified');
    }

    const { code: storedCode, expiresAt, pendingEmail } = user.emailVerification;
    if (code !== storedCode) {
      throw new Error('Invalid verification code');
    }
    if (Date.now() > new Date(expiresAt).getTime()) {
      throw new Error('Verification code expired');
    }

    user.emailVerification.verified = true;
    user.verified = true;
    if (pendingEmail) {
      user.email = pendingEmail;
      user.emailVerification.pendingEmail = null;
    }
    await user.save();

    return { message: 'Email verified successfully' };
  }

  // Resend verification email
  static async resendVerificationEmail(idNumber) {
    if (!idNumber) {
      throw new Error('ID number is required');
    }

    const user = await User.findOne({ idNumber });
    if (!user) {
      throw new Error('User not found');
    }
    if (!user.email && !user.emailVerification?.pendingEmail) {
      throw new Error('No email associated with this account');
    }
    if (user.verified) {
      throw new Error('Email is already verified');
    }

    const now = Date.now();
    const lastSent = user.emailVerification?.lastSentAt?.getTime() || 0;
    const cooldown = 5 * 60 * 1000;

    if (now - lastSent < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
      throw new Error(`Please wait ${wait}s before resending.`);
    }

    const code = this.generateVerificationCode();
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
    
    return { message: 'Verification email sent' };
  }

  // Update email
  static async updateEmail(idNumber, email) {
    if (!idNumber || !email) {
      throw new Error('ID number and email are required');
    }

    const user = await User.findOne({ idNumber });
    if (!user) {
      throw new Error('User not found');
    }

    if (await User.findOne({ email })) {
      throw new Error('Email already in use');
    }

    const now = Date.now();
    const lastSent = user.emailVerification?.lastSentAt?.getTime() || 0;
    const cooldown = 5 * 60 * 1000;

    if (now - lastSent < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
      throw new Error(`Please wait ${wait}s before updating email.`);
    }

    const code = this.updateVerificationDetails(user, email);
    await user.save();
    await sendVerificationEmail(email, code);

    return { message: 'Verification email sent to new email.' };
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new Error('Current and new passwords are required');
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.disabled) {
      throw new Error('Account is disabled');
    }

    const isMatch = await argon2.verify(user.password, currentPassword);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Prevent reuse of same password
    if (await argon2.verify(user.password, newPassword)) {
      throw new Error('New password cannot be the same as current password');
    }

    user.password = await argon2.hash(newPassword, { type: argon2.argon2id });
    await user.save();

    return { message: 'Password changed successfully. Please log in again.' };
  }

  // Get current user
  static async getCurrentUser(userId) {
    const user = await User.findById(userId)
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
      throw new Error('User not found');
    }
    if (user.disabled) {
      throw new Error('Account is disabled');
    }
    
    return {
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
      }
    };
  }

  // Blacklist token (for logout and password change)
  static async blacklistToken(token) {
    if (token) {
      await new BlacklistedToken({ token }).save();
    }
  }
}

module.exports = AuthService;