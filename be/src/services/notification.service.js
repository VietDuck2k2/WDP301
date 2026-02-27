const Notification = require('../models/Notification');

/**
 * Create a single notification
 */
const createNotification = async ({ recipient, type, title, body, refModel, ref }) => {
   return Notification.create({ recipient, type, title, body, refModel, ref });
};

/**
 * Create notifications for multiple recipients
 */
const createBulkNotifications = async (recipients, { type, title, body, refModel, ref }) => {
   const docs = recipients.map(recipient => ({
      recipient,
      type,
      title,
      body,
      refModel,
      ref
   }));
   return Notification.insertMany(docs);
};

/**
 * Get notifications for a user with pagination
 */
const getUserNotifications = async (userId, filters = {}) => {
   const { unreadOnly, page = 1, limit = 20 } = filters;
   const query = { recipient: userId };
   if (unreadOnly === 'true') query.isRead = false;

   const skip = (page - 1) * limit;

   const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false })
   ]);

   return {
      notifications,
      unreadCount,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
   };
};

/**
 * Mark notifications as read
 */
const markAsRead = async (notificationId, userId) => {
   const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
   );
   return notification;
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
   const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
   );
   return { modifiedCount: result.modifiedCount };
};

/**
 * Delete old notifications
 */
const deleteNotification = async (notificationId, userId) => {
   return Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
};

module.exports = {
   createNotification,
   createBulkNotifications,
   getUserNotifications,
   markAsRead,
   markAllAsRead,
   deleteNotification
};
