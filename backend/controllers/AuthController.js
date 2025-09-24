const AuthService = require('../services/AuthService');

const AuthController = {
  async login(req, res) {
    try {
      const { idNumber, password, rememberMe } = req.body;
      
      const result = await AuthService.login(idNumber, password);
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge,
        path: '/',
      });

      return res.json({
        message: 'Login successful',
        user: result.user,
      });
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('Invalid credentials') || 
                        error.message.includes('Please verify your email') ||
                        error.message.includes('Account is disabled') ? 401 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async register(req, res) {
    try {
      const { name, idNumber, email, password, courseId, rememberMe } = req.body;
      
      const result = await AuthService.register(name, idNumber, email, password, courseId);
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge,
        path: '/',
      });

      return res.status(201).json({
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('already exists') || 
                        error.message.includes('required') ||
                        error.message.includes('Invalid course') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async registerDepartmentHead(req, res) {
    try {
      const { name, idNumber, email, password, departmentCode } = req.body;
      
      const result = await AuthService.registerDepartmentHead(name, idNumber, email, password, departmentCode);

      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('already exists') || 
                        error.message.includes('required') ||
                        error.message.includes('Invalid department') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async logout(req, res) {
    try {
      const token = req.cookies.jwt;
      const result = await AuthService.logout(token);
      
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return res.json(result);
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('No token provided') || 
                        error.message.includes('already invalidated') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { code } = req.query;
      await AuthService.verifyEmail(code);
      
      return res.redirect('http://localhost:3000/verified');
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('required') || 
                        error.message.includes('Invalid') ||
                        error.message.includes('expired') ||
                        error.message.includes('already verified') ? 400 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async resendVerificationEmail(req, res) {
    try {
      const { idNumber } = req.query;
      const result = await AuthService.resendVerificationEmail(idNumber);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('required') || 
                        error.message.includes('not found') ||
                        error.message.includes('No email') ||
                        error.message.includes('already verified') ? 400 :
                        error.message.includes('wait') ? 429 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async updateEmail(req, res) {
    try {
      const { idNumber, email } = req.body;
      const result = await AuthService.updateEmail(idNumber, email);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('required') || 
                        error.message.includes('not found') ||
                        error.message.includes('already in use') ? 400 :
                        error.message.includes('wait') ? 429 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      await AuthService.changePassword(userId, currentPassword, newPassword);

      // Invalidate current JWT by blacklisting it and clearing cookie
      const token = req.cookies.jwt;
      await AuthService.blacklistToken(token);
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('required') || 
                        error.message.includes('must be at least') ||
                        error.message.includes('incorrect') ||
                        error.message.includes('cannot be the same') ? 400 :
                        error.message.includes('not found') ? 404 :
                        error.message.includes('disabled') ? 403 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },

  async getCurrentUser(req, res) {
    try {
      const result = await AuthService.getCurrentUser(req.user.id);
      return res.json(result);
    } catch (error) {
      console.error(error);
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('disabled') ? 403 : 500;
      return res.status(statusCode).json({ message: error.message });
    }
  },
};

module.exports = AuthController;