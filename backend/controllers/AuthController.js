const AuthService = require('../services/AuthService');

const AuthController = {
  async login(req, res) {
    try {
      const { idNumber, password, rememberMe } = req.body;
      
      const result = await AuthService.login({ idNumber, password, rememberMe });
      
      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.maxAge,
        path: '/',
      });

      return res.json({
        message: 'Login successful',
        user: result.user
      });
    } catch (error) {
      console.error(error);
      return res.status(error.message.includes('Invalid credentials') ? 401 : 
                       error.message.includes('disabled') ? 403 :
                       error.message.includes('verify') ? 403 : 500)
                .json({ message: error.message });
    }
  },

  async register(req, res) {
    try {
      const { name, idNumber, email, password, courseId, rememberMe } = req.body;
      
      const result = await AuthService.register({ 
        name, idNumber, email, password, courseId, rememberMe 
      });
      
      res.cookie('jwt', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.maxAge,
        path: '/',
      });

      return res.status(201).json({
        message: result.emailSent ? 
          'Registration successful, please verify your email.' : 
          'Registration successful',
        user: result.user
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }
  },

  async registerDepartmentHead(req, res) {
    try {
      const { name, idNumber, email, password, departmentCode } = req.body;
      
      const result = await AuthService.registerDepartmentHead({
        name, idNumber, email, password, departmentCode
      });

      return res.status(201).json({
        message: email ? 
          'Department head registration successful. This account was created by an admin. Please verify the email.' : 
          'Department head registration successful. This account was created by an admin.',
        adminRegistered: true,
        user: result.user
      });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }
  },

  async logout(req, res) {
    try {
      const token = req.cookies.jwt;
      
      await AuthService.logout(token);
      
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }
  },

  async verifyEmail(req, res) {
    try {
      const { code } = req.query;
      
      await AuthService.verifyEmail(code);
      
      return res.redirect('http://localhost:3000/verified');
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: error.message });
    }
  },

  async resendVerificationEmail(req, res) {
    try {
      const { idNumber } = req.query;
      
      const result = await AuthService.resendVerificationEmail(idNumber);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(error.message.includes('wait') ? 429 : 400)
                .json({ message: error.message });
    }
  },

  async updateEmail(req, res) {
    try {
      const { idNumber, email } = req.body;
      
      const result = await AuthService.updateEmail({ idNumber, email });
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(error.message.includes('wait') ? 429 : 400)
                .json({ message: error.message });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await AuthService.changePassword({ 
        userId, currentPassword, newPassword 
      });

      // Invalidate current JWT by blacklisting it
      const token = req.cookies.jwt;
      await AuthService.blacklistToken(token);
      
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(error.message.includes('incorrect') ? 401 : 400)
                .json({ message: error.message });
    }
  },

  async getCurrentUser(req, res) {
    try {
      const result = await AuthService.getCurrentUser(req.user.id);
      
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(error.message.includes('not found') ? 404 : 
                       error.message.includes('disabled') ? 403 : 500)
                .json({ message: error.message });
    }
  },
};

module.exports = AuthController;