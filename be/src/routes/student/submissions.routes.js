const express = require('express');
const router = express.Router();
const submissionsController = require('../../controllers/student/submissions.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireStudent } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and student role
router.use(authenticate, requireStudent);

// @route   GET /api/student/submissions
router.get('/', submissionsController.getMySubmissions);

// @route   GET /api/student/submissions/:id
router.get('/:id', validateObjectId('id'), submissionsController.getSubmissionById);

// @route   GET /api/student/assignments/:assignmentId/submission
router.get('/assignments/:assignmentId', validateObjectId('assignmentId'), submissionsController.getMySubmissionForAssignment);

// @route   POST /api/student/assignments/:assignmentId/submit
router.post('/assignments/:assignmentId/submit', validateObjectId('assignmentId'), submissionsController.submitAssignment);

// @route   POST /api/student/assignments/:assignmentId/save-draft
router.post('/assignments/:assignmentId/save-draft', validateObjectId('assignmentId'), submissionsController.saveDraft);

module.exports = router;
