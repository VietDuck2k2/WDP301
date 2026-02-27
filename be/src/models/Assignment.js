const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
   class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
   },
   title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true
   },
   description: {
      type: String,
      required: [true, 'Assignment description is required'],
      trim: true
   },
   instructions: {
      type: String,
      trim: true
   },
   dueDate: {
      type: Date,
      required: [true, 'Due date is required']
   },
   maxScore: {
      type: Number,
      required: [true, 'Max score is required'],
      min: [0, 'Max score cannot be negative'],
      default: 100
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
   status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft'
   },
   publishedAt: {
      type: Date
   }
}, {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

// Virtual for submissions count
assignmentSchema.virtual('submissionsCount', {
   ref: 'Submission',
   localField: '_id',
   foreignField: 'assignment',
   count: true
});

// Indexes for efficient queries
assignmentSchema.index({ class: 1, status: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ dueDate: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
