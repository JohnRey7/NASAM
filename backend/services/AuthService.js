const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Course = require('../models/Course');
const Role = require('../models/Role');
const Department = require('../models/Department');
const BlacklistedToken = require('../models/BlacklistedToken');
const sendVerificationEmail = require('../utils/sendVerificationEmail');
const SoftDeleteUtils = require('../utils/SoftDeleteUtils');

class AuthService {
  // Helper: Generate a 6-digit verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Helper: Generate a JWT token for a user
  generateToken(user) {
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
  updateVerificationDetails(user, pendingEmail = null) {
    const code = AuthService.generateVerificationCode();
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

  // Helper: Check rate limiting for email operations
  checkEmailRateLimit(user) {
    const now = Date.now();
    const lastSent = user.emailVerification?.lastSentAt?.getTime() || 0;
    const cooldown = 5 * 60 * 1000; // 5 minutes

    if (now - lastSent < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastSent)) / 1000);
      throw new Error(`Please wait ${wait}s before resending.`);
    }
  }

  // Login user
  static async login(credentials) {
    const { idNumber, password, rememberMe } = credentials;
    
    if (!idNumber || !password) {
      throw new Error('ID number and password are required');
    }

    const user = await User.findOne(SoftDeleteUtils.addSoftDeleteFilter({ idNumber })).populate('role');
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

    const token = AuthService.generateToken(user);
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    return {
      token,
      maxAge,
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

  // Register new user
  static async register(userData) {
    const { name, idNumber, email, password, courseId, rememberMe } = userData;
    
    if (!name || !idNumber || !password || !courseId) {
      throw new Error('Name, ID number, password, and course ID are required');
    }

    if (await User.findOne(SoftDeleteUtils.addSoftDeleteFilter({ idNumber }))) {
      throw new Error('ID number already exists');
    }
    
    if (email && (await User.findOne(SoftDeleteUtils.addSoftDeleteFilter({ email })))) {
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
      throw new Error('Invalid role ID');
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

    let verificationCode = null;
    if (email) {
      verificationCode = AuthService.updateVerificationDetails(user);
      await sendVerificationEmail(user.email, verificationCode);
    }

    await user.save();

    const token = AuthService.generateToken({ ...user._doc, role });
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    return {
      token,
      maxAge,
      message: email ? 'Registration successful, please verify your email.' : 'Registration successful',
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
  static async registerDepartmentHead(userData) {
    const { name, idNumber, email, password, departmentCode } = userData;
    
    if (!name || !idNumber || !password || !departmentCode) {
      throw new Error('Name, ID number, password, and department code are required');
    }

    if (await User.findOne(SoftDeleteUtils.addSoftDeleteFilter({ idNumber }))) {
      throw new Error('ID number already exists');
    }
    
    if (email && (await User.findOne(SoftDeleteUtils.addSoftDeleteFilter({ email })))) {
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
      // No verification email sent
    }

    await user.save();

    return {
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

    const user = await User.findOne({ 'emailVerification.code': code, is_deleted: false }).populate('role');
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

    // Check rate limiting
    AuthService.checkEmailRateLimit(user);

    const code = AuthService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
  static async updateEmail(idNumber, newEmail) {
    if (!idNumber || !newEmail) {
      throw new Error('ID number and email are required');
    }

    const user = await User.findOne({ idNumber });
    if (!user) {
      throw new Error('User not found');
    }

    if (await User.findOne({ email: newEmail })) {
      throw new Error('Email already in use');
    }

    // Check rate limiting
    AuthService.checkEmailRateLimit(user);

    const code = AuthService.updateVerificationDetails(user, newEmail);
    await user.save();
    await sendVerificationEmail(newEmail, code);

    return { message: 'Verification email sent to new email.' };
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword, currentToken) {
    try {
      // Validate inputs
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isMatch = await argon2.verify(user.password, currentPassword);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });
      user.password = hashedPassword;
      await user.save();

      // Invalidate current session
      if (currentToken) {
        await new BlacklistedToken({ token: currentToken }).save();
      }

      return { message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  static async getCurrentUser(userId) {
    try {
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
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
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
        path: 'department',
        select: 'departmentCode name'
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
        department: user.department,
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

  // Blacklist token
  static async blacklistToken(token) {
    if (token) {
      const existingToken = await BlacklistedToken.findOne({ token });
      if (!existingToken) {
        await new BlacklistedToken({ token }).save();
      }
    }
  }

  // Validate user credentials (helper for other services)
  static async validateUser(idNumber, password) {
    const user = await User.findOne({ idNumber }).populate('role');
    if (!user) {
      return null;
    }

    if (user.disabled) {
      throw new Error('Account is disabled');
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return null;
    }

    return user;
  }

  // Check if user exists
  static async userExists(criteria) {
    if (criteria.idNumber) {
      return await User.findOne({ idNumber: criteria.idNumber });
    }
    if (criteria.email) {
      return await User.findOne({ email: criteria.email });
    }
    return null;
  }

  // Get user by ID
  static async getUserById(userId) {
    return await User.findById(userId).populate('role course department');
  }

  // Update user verification status
  static async updateUserVerificationStatus(userId, verified = true) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.verified = verified;
    if (verified && user.emailVerification) {
      user.emailVerification.verified = true;
    }
    
    await user.save();
    return user;
  }

  // Clean up expired verification codes (utility method)
  static async cleanupExpiredCodes() {
    const now = new Date();
    const result = await User.updateMany(
      { 'emailVerification.expiresAt': { $lt: now } },
      { $unset: { emailVerification: 1 } }
    );
    
    return { deletedCount: result.modifiedCount };
  }

  // Clean up expired blacklisted tokens (utility method)
  static async cleanupExpiredTokens() {
    // Assuming tokens have a 1 day expiry, clean up tokens older than 2 days
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = await BlacklistedToken.deleteMany({
      createdAt: { $lt: twoDaysAgo }
    });
    
    return { deletedCount: result.deletedCount };
  }

  // Soft Delete Methods
  static async softDeleteUser(userId) {
    try {
      const result = await SoftDeleteUtils.softDeleteById(User, userId);
      return { message: 'User soft deleted successfully', data: result };
    } catch (error) {
      console.error('Error soft deleting user:', error);
      throw error;
    }
  }

  static async restoreUser(userId) {
    try {
      const result = await SoftDeleteUtils.restoreById(User, userId);
      return { message: 'User restored successfully', data: result };
    } catch (error) {
      console.error('Error restoring user:', error);
      throw error;
    }
  }

  static async permanentDeleteUser(userId) {
    try {
      const result = await SoftDeleteUtils.permanentDeleteById(User, userId);
      return { message: 'User permanently deleted', data: result };
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  static async getSoftDeletedUsers(query = {}) {
    try {
      return await SoftDeleteUtils.getSoftDeleted(User, query);
    } catch (error) {
      console.error('Error getting soft deleted users:', error);
      throw error;
    }
  }
}

module.exports = AuthService;