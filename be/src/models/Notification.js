const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
   recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required']
   },
   type: {
      type: String,
      enum: [
         'announcement',    // New class announcement
         'assignment',      // New assignment or updated deadline
         'submission',      // Submission graded
         'attendance',      // Attendance marked
         'session',         // Session status change
         'class',           // Enrolled / removed from class
         'system'           // General system notification
      ],
      required: [true, 'Notification type is required']
   },
   title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
   },
   body: {
      type: String,
      trim: true
   },
   // Reference to the related entity (optional)
   refModel: {
      type: String,
      enum: ['Announcement', 'Assignment', 'Session', 'Class', 'Submission', null]
   },
   ref: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
   },
   isRead: {
      type: Boolean,
      default: false
   },
   readAt: {
      type: Date,
      default: null
   }
}, {
   timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
