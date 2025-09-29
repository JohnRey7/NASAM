const AuthService = require('../services/AuthService');

const AuthController = {
  async login(req, res) {
    try {
      const result = await AuthService.login(req.body);

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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: result.maxAge,
        path: '/',
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

      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
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
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
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

  async verifyEmail(req, res) {
    try {
      const { code } = req.query;
      await AuthService.verifyEmail(code);

      return res.redirect('http://localhost:3000/verified');
    } catch (error) {
      console.error(error);
      if (error.message.includes('required') || error.message.includes('Invalid') || error.message.includes('already verified') || error.message.includes('expired')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Server error' });
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

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await AuthService.changePassword(userId, currentPassword, newPassword);

      // Invalidate current JWT by blacklisting it
      const token = req.cookies.jwt;
      if (token) {
        await AuthService.blacklistToken(token);
        res.clearCookie('jwt', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
        });
      }

      return res.json(result);
    } catch (error) {
      console.error(error);
      if (error.message.includes('required') || error.message.includes('at least 8 characters') || error.message.includes('cannot be the same')) {
        return res.status(400).json({ message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('disabled')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes('incorrect')) {
        return res.status(401).json({ message: error.message });
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


};

module.exports = AuthController;