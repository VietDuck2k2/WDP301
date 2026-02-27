const express = require('express');
const router = express.Router();
const attendanceController = require('../../controllers/admin/attendance.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// @route   GET /api/admin/attendances
router.get('/', attendanceController.getAllAttendances);

// @route   GET /api/admin/attendances/sessions/:sessionId
router.get('/sessions/:sessionId', validateObjectId('sessionId'), attendanceController.getSessionAttendance);

// @route   GET /api/admin/attendances/students/:studentId
router.get('/students/:studentId', validateObjectId('studentId'), attendanceController.getStudentAttendanceSummary);

// @route   PUT /api/admin/attendances/:id
router.put('/:id', validateObjectId('id'), attendanceController.updateAttendance);

// @route   DELETE /api/admin/attendances/:id
router.delete('/:id', validateObjectId('id'), attendanceController.deleteAttendance);

module.exports = router;
