const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
   class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
   },
   title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
   },
   content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true
   },
   priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal'
   },
   attachments: [{
      name: String,
      url: String,
      uploadedAt: {
         type: Date,
         default: Date.now
      }
   }],
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required']
   },
   isPinned: {
      type: Boolean,
      default: false
   },
   isPublished: {
      type: Boolean,
      default: true
   }
}, {
   timestamps: true
});

// Indexes for efficient queries
announcementSchema.index({ class: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ createdBy: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
