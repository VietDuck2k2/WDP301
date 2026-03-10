const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');
const { validateObjectId } = require('../middlewares/validate.middleware');

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for logged-in user
 * @access  Private (all roles)
 */
const getMyNotifications = async (req, res, next) => {
   try {
      const data = await notificationService.getUserNotifications(req.user._id, req.query);
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
   try {
      const notification = await notificationService.markAsRead(req.params.id, req.user._id);
      ApiResponse.ok(res, notification, 'Notification marked as read');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
   try {
      const result = await notificationService.markAllAsRead(req.user._id);
      ApiResponse.ok(res, result, 'All notifications marked as read');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
   try {
      await notificationService.deleteNotification(req.params.id, req.user._id);
      ApiResponse.ok(res, null, 'Notification deleted');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyNotifications,
   markAsRead,
   markAllAsRead,
   deleteNotification
};
