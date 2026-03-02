const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true
   },
   code: {
      type: String,
      required: [true, 'Class code is required'],
      unique: true,
      uppercase: true,
      trim: true
   },
   description: {
      type: String,
      trim: true
   },
   level: {
      type: String,
      required: [true, 'Level is required'],
      enum: ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'],
      default: 'beginner'
   },
   capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      default: 20
   },
   startDate: {
      type: Date,
      required: [true, 'Start date is required']
   },
   endDate: {
      type: Date,
      required: [true, 'End date is required']
   },
   scheduleTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduleTemplate',
      default: null
   },
   room: {
      type: String,
      trim: true
   },
   status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'draft'
   },
   isActive: {
      type: Boolean,
      default: true
   }
}, {
   timestamps: true,
   toJSON: { virtuals: true },
   toObject: { virtuals: true }
});

// Virtual for enrolled students count
classSchema.virtual('enrolledCount', {
   ref: 'ClassMember',
   localField: '_id',
   foreignField: 'class',
   count: true,
   match: { status: 'active', role: 'student' }
});

// Index for efficient queries
classSchema.index({ status: 1, isActive: 1 });
classSchema.index({ startDate: 1, endDate: 1 });

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
