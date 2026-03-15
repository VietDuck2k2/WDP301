const express = require('express');
const router = express.Router();
const sessionsController = require('../../controllers/admin/sessions.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId, validateDate, validateTime } = require('../../middlewares/validate.middleware');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// @route   GET /api/admin/sessions
router.get('/', sessionsController.getAllSessions);

// @route   GET /api/admin/sessions/:id
router.get('/:id', validateObjectId('id'), sessionsController.getSessionById);

// @route   POST /api/admin/sessions
router.post(
   '/',
   validate(['class', 'title', 'sessionNumber', 'date', 'startTime', 'endTime']),
   validateDate('date'),
   validateTime('startTime'),
   validateTime('endTime'),
   sessionsController.createSession
);

// @route   PUT /api/admin/sessions/:id
router.put('/:id', validateObjectId('id'), sessionsController.updateSession);

// @route   DELETE /api/admin/sessions/:id
router.delete('/:id', validateObjectId('id'), sessionsController.deleteSession);

// @route   POST /api/admin/sessions/:id/makeup
router.post(
   '/:id/makeup',
   validateObjectId('id'),
   validate(['date', 'slotNumber']),
   validateDate('date'),
   sessionsController.createMakeupSession
);

module.exports = router;
