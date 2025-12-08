const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.post('/', authenticate, checkPermission('role.create'), RoleController.createRole);
router.get('/', authenticate, checkPermission('role.read'), RoleController.getAllRoles);
router.get('/permissions', authenticate, checkPermission('role.read'), RoleController.getAllPermissions);
router.get('/deleted', authenticate, checkPermission('role.read'), RoleController.getSoftDeletedRoles);
router.get('/:id', authenticate, checkPermission('role.read.id'), RoleController.getRoleById);
router.patch('/:id', authenticate, checkPermission('role.update'), RoleController.updateRole);
router.delete('/:id', authenticate, checkPermission('role.delete'), RoleController.deleteRole);

// Role soft delete routes
router.delete('/:id/soft', authenticate, checkPermission('role.delete'), RoleController.softDeleteRole);
router.put('/:id/restore', authenticate, checkPermission('role.delete'), RoleController.restoreRole);
router.delete('/:id/permanent', authenticate, checkPermission('role.delete'), RoleController.permanentDeleteRole);

module.exports = router;
