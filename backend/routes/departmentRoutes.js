const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.post('/', authenticate, checkPermission('department.create'), DepartmentController.createDepartment);
router.get('/', authenticate, checkPermission('department.read'), DepartmentController.getAllDepartments);
router.get('/deleted', authenticate, checkPermission('department.read'), DepartmentController.getSoftDeletedDepartments);
router.get('/:departmentCode', authenticate, checkPermission('department.read'), DepartmentController.getDepartmentByCode);
router.patch('/:departmentCode', authenticate, checkPermission('department.update'), DepartmentController.updateDepartment);
router.delete('/:departmentCode', authenticate, checkPermission('department.delete'), DepartmentController.deleteDepartment);

// Soft delete routes for departments
router.delete('/:departmentCode/soft', authenticate, checkPermission('department.delete'), DepartmentController.softDeleteDepartment);
router.put('/:departmentCode/restore', authenticate, checkPermission('department.delete'), DepartmentController.restoreDepartment);
router.delete('/:departmentCode/permanent', authenticate, checkPermission('department.delete'), DepartmentController.permanentDeleteDepartment);

// Department Head Management Routes (use null values to remove head)
router.post('/:departmentCode/head/id', authenticate, checkPermission('department.update'), DepartmentController.setDepartmentHeadById);
router.post('/:departmentCode/head/idnumber', authenticate, checkPermission('department.update'), DepartmentController.setDepartmentHeadByIdNumber);

module.exports = router;
