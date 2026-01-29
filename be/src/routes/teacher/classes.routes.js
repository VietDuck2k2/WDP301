const express = require('express');
const router = express.Router();
const classesController = require('../../controllers/teacher/classes.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireTeacher } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and teacher role
router.use(authenticate, requireTeacher);

// @route   GET /api/teacher/classes
router.get('/', classesController.getMyClasses);

// @route   GET /api/teacher/classes/:id
router.get('/:id', validateObjectId('id'), classesController.getClassById);

// @route   GET /api/teacher/classes/:id/members
router.get('/:id/members', validateObjectId('id'), classesController.getClassMembers);

module.exports = router;
