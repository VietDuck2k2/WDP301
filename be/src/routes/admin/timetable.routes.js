const express = require('express');
const router = express.Router();
const timetableController = require('../../controllers/admin/timetable.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId } = require('../../middlewares/validate.middleware');

router.use(authenticate, requireAdmin);

// @route   GET /api/admin/timetable
router.get('/', timetableController.getTimetable);

// @route   POST /api/admin/timetable/generate
router.post('/generate', validate(['classId', 'templateId']), timetableController.generateSessions);

module.exports = router;
