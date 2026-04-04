const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema(
   {
      actor: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true
      },
      action: {
         type: String,
         required: true
      },
      resourceType: {
         type: String,
         enum: ['class', 'room', 'schedule_template'],
         required: true
      },
      resourceId: {
         type: mongoose.Schema.Types.ObjectId,
         default: null
      },
      summary: {
         type: String,
         default: ''
      },
      metadata: {
         type: mongoose.Schema.Types.Mixed,
         default: {}
      }
   },
   { timestamps: true }
);

adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ resourceType: 1, createdAt: -1 });
adminActivityLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model('AdminActivityLog', adminActivityLogSchema);
