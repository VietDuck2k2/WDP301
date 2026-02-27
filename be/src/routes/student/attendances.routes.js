const express = require('express');
const router = express.Router();
const attendanceController = require('../../controllers/student/attendance.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireStudent } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and student role
router.use(authenticate, requireStudent);

// @route   GET /api/student/attendances
router.get('/', attendanceController.getMyAttendances);

// @route   GET /api/student/attendances/summary
router.get('/summary', attendanceController.getMyAttendanceSummary);

// @route   GET /api/student/attendances/classes/:classId
router.get('/classes/:classId', validateObjectId('classId'), attendanceController.getMyAttendanceByClass);

module.exports = router;
