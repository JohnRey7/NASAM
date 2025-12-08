const express = require('express');
const router = express.Router();
const InterviewController = require('../controllers/InterviewController');
const authenticate = require('../middleware/authenticate');
const checkPermission = require('../middleware/checkPermission');

// Review Routes - Interview-based reviews with application and document data
router.get('/:interviewId', authenticate, checkPermission('interview.readOwn'), InterviewController.getReviewByInterviewId);
router.get('/', authenticate, checkPermission('interview.readOwn'), InterviewController.getReviewList);

module.exports = router;
