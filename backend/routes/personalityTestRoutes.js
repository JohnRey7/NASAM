const express = require('express');
const router = express.Router();
const PersonalityTestController = require('../controllers/PersonalityTestController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

router.get('/status', authenticate, PersonalityTestController.getPersonalityTestStatus);
router.post('/start', authenticate, checkPermission('personality_test.create'), PersonalityTestController.startPersonalityTest);
router.post('/answer', authenticate, checkPermission('personality_test.answer'), PersonalityTestController.answerPersonalityTest);
router.get('/stop', authenticate, checkPermission('personality_test.stop'), PersonalityTestController.stopPersonalityTest);
router.get('/me', authenticate, checkPermission('personality_test.readOwn'), PersonalityTestController.getMyPersonalityTest);
router.get('/all', authenticate, checkPermission('personality_test.readAll'), PersonalityTestController.getAllUserPersonalityTest);
router.get('/deleted', authenticate, checkPermission('personality_test.read'), PersonalityTestController.getSoftDeletedPersonalityTests);
router.get('/user/:userId', authenticate, checkPermission('personality_test.read'), PersonalityTestController.getPersonalityTestByUserId);
router.patch('/test/:testId', authenticate, checkPermission('personality_test.update'), PersonalityTestController.updatePersonalityTest);
router.delete('/user/:userId', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.deletePersonalityTestByUserId);
router.patch('/user/:userId/mark-reviewed', authenticate, checkPermission('personality_test.update'), PersonalityTestController.markAsReviewed);
router.patch('/user/:userId/revert-review', authenticate, checkPermission('personality_test.update'), PersonalityTestController.revertReview);

// Personality Test Template routes
router.post('/template', authenticate, checkPermission('personality_test.template.create'), PersonalityTestController.createTemplate);
router.get('/template', authenticate, checkPermission('personality_test.template.read'), PersonalityTestController.getAllTemplates);
router.get('/template/:id', authenticate, checkPermission('personality_test.template.read'), PersonalityTestController.getTemplateById);
router.patch('/template/:id', authenticate, checkPermission('personality_test.template.update'), PersonalityTestController.updateTemplate);
router.delete('/template/:id', authenticate, checkPermission('personality_test.template.delete'), PersonalityTestController.deleteTemplate);

// Soft delete routes for personality tests
router.delete('/:id/soft', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.softDeletePersonalityTest);
router.put('/:id/restore', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.restorePersonalityTest);
router.delete('/:id/permanent', authenticate, checkPermission('personality_test.delete'), PersonalityTestController.permanentDeletePersonalityTest);

module.exports = router;
