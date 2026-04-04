const express = require('express');
const router = express.Router();
const activityLogsController = require('../../controllers/admin/activityLogs.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');

router.use(authenticate, requireAdmin);

router.get('/', activityLogsController.getActivityLogs);

module.exports = router;
