const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// User management routes (admin only)
router.post('/', authenticate, checkPermission('user.create'), UserController.createUser);
router.get('/disabled', authenticate, checkPermission('user.read'), UserController.getDisabledUsers);
router.get('/deleted', authenticate, checkPermission('user.read'), UserController.getSoftDeletedUsers);
router.get('/interviewers', authenticate, UserController.getInterviewers);
router.get('/idnumber/:idNumber', authenticate, checkPermission('user.read'), UserController.getUserByIdNumber);

// User profile routes
router.put('/profile', authenticate, UserController.updateProfile);
router.get('/profile', authenticate, UserController.getProfile);

// General user routes
router.get('/', authenticate, checkPermission('user.read'), UserController.getAllUsers);
router.get('/:id', authenticate, checkPermission('user.read'), UserController.getUserById);
router.patch('/idnumber/:idNumber', authenticate, checkPermission('user.update'), UserController.updateUserByIdNumber);
router.patch('/:id', authenticate, checkPermission('user.update'), UserController.updateUser);
router.delete('/idnumber/:idNumber', authenticate, checkPermission('user.delete'), UserController.deleteUserByIdNumber);
router.delete('/:id', authenticate, checkPermission('user.delete'), UserController.deleteUser);

// User disable/enable routes
router.patch('/:id/disable', authenticate, checkPermission('user.update'), UserController.disableUser);
router.patch('/:id/enable', authenticate, checkPermission('user.update'), UserController.enableUser);
router.patch('/idnumber/:idNumber/disable', authenticate, checkPermission('user.update'), UserController.disableUserByIdNumber);
router.patch('/idnumber/:idNumber/enable', authenticate, checkPermission('user.update'), UserController.enableUserByIdNumber);

// User soft delete routes
router.delete('/:id/soft', authenticate, checkPermission('user.delete'), UserController.deleteUser);
router.put('/:id/restore', authenticate, checkPermission('user.delete'), UserController.restoreUser);
router.delete('/:id/permanent', authenticate, checkPermission('user.delete'), UserController.permanentDeleteUser);

module.exports = router;
