const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/register/dept-head', authenticate, checkPermission('user.create'), AuthController.registerDepartmentHead);
router.post('/logout', authenticate, AuthController.logout);
router.post('/forgot-password', AuthController.forgotPasswordVerifyEmail);
router.post('/forgot-password/change-password', AuthController.forgotPasswordChangePassword);
router.post('/change-password', authenticate, AuthController.changePassword);
router.get('/me', authenticate, AuthController.getCurrentUser);
router.get('/email/verify', AuthController.verifyEmail);
router.get('/email/resend', AuthController.resendVerificationEmail);
router.put('/email', authenticate, AuthController.updateEmail);

module.exports = router;
