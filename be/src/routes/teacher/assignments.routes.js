const express = require('express');
const router = express.Router();
const assignmentsController = require('../../controllers/teacher/assignments.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireTeacher } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId, validateDate } = require('../../middlewares/validate.middleware');

// All routes require authentication and teacher role
router.use(authenticate, requireTeacher);

// @route   GET /api/teacher/assignments
router.get('/', assignmentsController.getMyAssignments);

// @route   POST /api/teacher/assignments
router.post(
   '/',
   validate(['class', 'title', 'description', 'dueDate', 'closeDate', 'maxScore']),
   validateDate('dueDate'),
   validateDate('closeDate'),
   assignmentsController.createAssignment
);

// @route   POST /api/teacher/submissions/:id/grade
// MUST come before /:id routes to avoid route shadowing
router.post(
   '/submissions/:id/grade',
   validateObjectId('id'),
   validate(['score']),
   assignmentsController.gradeSubmission
);

// @route   POST /api/teacher/submissions/:id/return
router.post(
   '/submissions/:id/return',
   validateObjectId('id'),
   validate(['returnReason']),
   assignmentsController.returnSubmission
);

// @route   GET /api/teacher/assignments/:id
router.get('/:id', validateObjectId('id'), assignmentsController.getAssignmentById);

// @route   PUT /api/teacher/assignments/:id
router.put('/:id', validateObjectId('id'), assignmentsController.updateAssignment);

// @route   DELETE /api/teacher/assignments/:id
router.delete('/:id', validateObjectId('id'), assignmentsController.deleteAssignment);

// @route   POST /api/teacher/assignments/:id/publish
router.post('/:id/publish', validateObjectId('id'), assignmentsController.publishAssignment);

// @route   POST /api/teacher/assignments/:id/close
router.post('/:id/close', validateObjectId('id'), assignmentsController.closeAssignment);

// @route   GET /api/teacher/assignments/:id/submissions
router.get('/:id/submissions', validateObjectId('id'), assignmentsController.getAssignmentSubmissions);

module.exports = router;
