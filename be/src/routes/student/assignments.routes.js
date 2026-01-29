const express = require('express');
const router = express.Router();
const assignmentsController = require('../../controllers/student/assignments.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireStudent } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and student role
router.use(authenticate, requireStudent);

// @route   GET /api/student/classes/:classId/assignments
router.get('/classes/:classId', validateObjectId('classId'), assignmentsController.getClassAssignments);

// @route   GET /api/student/assignments/:id
router.get('/:id', validateObjectId('id'), assignmentsController.getAssignmentById);

module.exports = router;
