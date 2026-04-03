const express = require('express');
const router = express.Router();
const classesController = require('../../controllers/student/classes.controller');
const announcementsController = require('../../controllers/student/announcements.controller');
const assignmentsController = require('../../controllers/student/assignments.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireStudent } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and student role
router.use(authenticate, requireStudent);

// @route   GET /api/student/classes
router.get('/', classesController.getMyClasses);

// @route   GET /api/student/classes/:id
router.get('/:id', validateObjectId('id'), classesController.getClassById);

// @route   GET /api/student/classes/:id/students
router.get('/:id/students', validateObjectId('id'), classesController.getClassStudents);

// @route   GET /api/student/classes/:classId/announcements
router.get('/:classId/announcements', validateObjectId('classId'), announcementsController.getClassAnnouncements);

// @route   GET /api/student/classes/:classId/assignments
router.get('/:classId/assignments', validateObjectId('classId'), assignmentsController.getClassAssignments);

module.exports = router;
