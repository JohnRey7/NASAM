const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/CourseController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.post('/', authenticate, checkPermission('course.create'), CourseController.createCourse);
router.get('/all', authenticate, checkPermission('course.read'), CourseController.getAllCourses);
router.get('/all/deleted', authenticate, checkPermission('course.read.deleted'), CourseController.getDeletedCourses);
router.get('/department/:departmentId', authenticate, checkPermission('course.read'), CourseController.getCoursesByDepartment);
router.put('/:courseId', authenticate, checkPermission('course.update'), CourseController.updateCourseByCourseId);
router.put('/name/:name', authenticate, checkPermission('course.update'), CourseController.updateCourseByName);
router.put('/:courseId/restore', authenticate, checkPermission('course.delete.soft'), CourseController.restoreByCourseId);
router.put('/name/:name/restore', authenticate, checkPermission('course.delete.soft'), CourseController.restoreByName);
router.delete('/:courseId/soft', authenticate, checkPermission('course.delete.soft'), CourseController.softDeleteByCourseId);
router.delete('/name/:name/soft', authenticate, checkPermission('course.delete.soft'), CourseController.softDeleteByName);
router.delete('/:courseId/permanent', authenticate, checkPermission('course.delete.hard'), CourseController.permanentDeleteByCourseId);
router.delete('/name/:name/permanent', authenticate, checkPermission('course.delete.hard'), CourseController.permanentDeleteByName);

module.exports = router;
