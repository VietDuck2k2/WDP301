const express = require('express');
const router = express.Router();
const attendancesController = require('../../controllers/teacher/attendances.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireTeacher } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and teacher role
router.use(authenticate, requireTeacher);

// @route   GET /api/teacher/sessions/:sessionId/attendance
router.get('/sessions/:sessionId', validateObjectId('sessionId'), attendancesController.getSessionAttendance);

// @route   POST /api/teacher/sessions/:sessionId/attendance
router.post(
  '/sessions/:sessionId',
  validateObjectId('sessionId'),
  validate(['studentId', 'status']),
  attendancesController.markAttendance
);

// @route   POST /api/teacher/sessions/:sessionId/attendance/bulk
router.post(
  '/sessions/:sessionId/bulk',
  validateObjectId('sessionId'),
  validate(['attendanceList']),
  attendancesController.bulkMarkAttendance
);

// @route   GET /api/teacher/students/:studentId/attendance
router.get('/students/:studentId', validateObjectId('studentId'), attendancesController.getStudentAttendanceSummary);

module.exports = router;
