const express = require('express');
const router = express.Router();
const sessionsController = require('../../controllers/teacher/sessions.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireTeacher } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and teacher role
router.use(authenticate, requireTeacher);

// @route   GET /api/teacher/sessions
router.get('/', sessionsController.getMySessions);

// @route   GET /api/teacher/sessions/:id
router.get('/:id', validateObjectId('id'), sessionsController.getSessionById);

// @route   PUT /api/teacher/sessions/:id
router.put('/:id', validateObjectId('id'), sessionsController.updateSession);

// @route   POST /api/teacher/sessions/:id/materials
router.post('/:id/materials', validateObjectId('id'), sessionsController.addMaterial);

// @route   GET /api/teacher/classes/:classId/sessions
router.get('/classes/:classId', validateObjectId('classId'), sessionsController.getClassSessions);

module.exports = router;
