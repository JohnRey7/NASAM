const AuthService = require('../services/AuthService');
const AuditLogService = require('../services/AuditLogService');

const AuthController = {
  async login(req, res) {
    try {
      const result = await AuthService.login(req.body);

      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: false, // Set to false for HTTP in production (or use HTTPS)
        sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-origin
        maxAge: result.maxAge,
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
      });

      await AuditLogService.createLog({
        userId: result.user.id,
        action: 'User Login',
        module: 'Authentication',
      });

      return res.json({
        message: 'Login successful',
        user: result.user
      });
    } catch (error) {
      console.error(error);
      if (error.message.includes('required') || error.message.includes('Invalid credentials')) {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes('disabled')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('verify your email')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('role is missing')) {
        return res.status(500).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async register(req, res) {
    try {
      const result = await AuthService.register(req.body);

      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: false, // Set to false for HTTP in production (or use HTTPS)
        sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-origin
        maxAge: result.maxAge,
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
      });
      
      return res.status(201).json({
        message: result.message,
        user: result.user
      });
    } catch (error) {
      console.error(error);
      if (error.message.includes('required') || error.message.includes('already exists') || error.message.includes('Invalid')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async registerDepartmentHead(req, res) {
    try {
      const result = await AuthService.registerDepartmentHead(req.body);
      
      return res.status(201).json({
        message: result.message,
        user: result.user
      });
    } catch (error) {
      console.error('Error in registerDepartmentHead:', error);
      if (error.message.includes('required') || error.message.includes('already exists') || error.message.includes('Invalid') || error.message.includes('not found')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async logout(req, res) {
    try {
      const token = req.cookies.jwt;
      const result = await AuthService.logout(token);
      
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: false, // Set to false for HTTP in production (or use HTTPS)
        sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-origin
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
      });

      return res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('No token') || error.message.includes('already invalidated')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async forgotPasswordVerifyEmail(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const result = await AuthService.forgotPasswordVerifyEmail(email);
      return res.json(result);
    } catch (error) {
      console.error('Forgot password verify email error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async forgotPasswordChangePassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ 
          message: 'Email, verification code, and new password are required' 
        });
      }

      const result = await AuthService.forgotPasswordChangePassword(email, code, newPassword);
      return res.json(result);
    } catch (error) {
      console.error('Forgot password change password error:', error);
      if (error.message.includes('not found') || 
          error.message.includes('Invalid') || 
          error.message.includes('expired')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { code } = req.query;
      await AuthService.verifyEmail(code);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      // Redirect to home page with success message
      return res.redirect(`${frontendUrl}?verified=success`);
    } catch (error) {
      console.error(error);
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('already verified') || error.message.includes('expired')) {
        // Redirect to home page with error message
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
        return res.redirect(`${frontendUrl}?verified=error&message=${encodeURIComponent(error.message)}`);
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}?verified=error&message=Server error`);
    }
  },

  async resendVerificationEmail(req, res) {
    try {
      const { idNumber } = req.query;
      const result = await AuthService.resendVerificationEmail(idNumber);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('No email') || error.message.includes('already verified')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('Please wait')) {
        return res.status(429).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async updateEmail(req, res) {
    try {
      const { idNumber, email } = req.body;
      const result = await AuthService.updateEmail(idNumber, email);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('required')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('already in use')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('Please wait')) {
        return res.status(429).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  

  async getCurrentUser(req, res) {
    try {
      const result = await AuthService.getCurrentUser(req.user.id);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('disabled')) {
        return res.status(403).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: 'Current password and new password are required' 
        });
      }

      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      
      await AuditLogService.createLog({
        userId: req.user.id,
        action: 'Password Changed',
        module: 'Authentication',
      });

      return res.json(result);
    } catch (error) {
      console.error('Change password error:', error);
      if (error.message.includes('Current password is incorrect')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  },


};

module.exports = AuthController;

