const express = require('express');
const router = express.Router();
const reportsController = require('../../controllers/admin/reports.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');

router.use(authenticate, requireAdmin);

// @route   GET /api/admin/reports/attendance
router.get('/attendance', reportsController.getAttendanceReport);

// @route   GET /api/admin/reports/assignments
router.get('/assignments', reportsController.getAssignmentReport);

// @route   GET /api/admin/reports/overview
router.get('/overview', reportsController.getOverviewReport);

module.exports = router;
