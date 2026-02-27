const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboard.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// @route   GET /api/admin/dashboard/stats
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
