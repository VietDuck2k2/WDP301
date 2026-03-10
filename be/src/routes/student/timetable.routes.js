const express = require('express');
const router = express.Router();
const timetableController = require('../../controllers/student/timetable.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireStudent } = require('../../middlewares/rbac.middleware');

router.use(authenticate, requireStudent);

// @route   GET /api/student/timetable
router.get('/', timetableController.getMyTimetable);

module.exports = router;
