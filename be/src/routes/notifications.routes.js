const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateObjectId } = require('../middlewares/validate.middleware');

// All routes require authentication (any role)
router.use(authenticate);

// @route   GET /api/notifications
router.get('/', notificationsController.getMyNotifications);

// @route   PUT /api/notifications/read-all
// Must come BEFORE /:id route to avoid conflict
router.put('/read-all', notificationsController.markAllAsRead);

// @route   PUT /api/notifications/:id/read
router.put('/:id/read', validateObjectId('id'), notificationsController.markAsRead);

// @route   DELETE /api/notifications/:id
router.delete('/:id', validateObjectId('id'), notificationsController.deleteNotification);

module.exports = router;
