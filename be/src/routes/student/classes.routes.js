const express = require('express');
const router = express.Router();
const classesController = require('../../controllers/student/classes.controller');
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

module.exports = router;
