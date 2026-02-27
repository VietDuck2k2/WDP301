const express = require('express');
const router = express.Router();
const timetableController = require('../../controllers/teacher/timetable.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireTeacher } = require('../../middlewares/rbac.middleware');

router.use(authenticate, requireTeacher);

// @route   GET /api/teacher/timetable
router.get('/', timetableController.getMyTimetable);

module.exports = router;
