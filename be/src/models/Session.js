const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
   class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
   },
   title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true
   },
   description: {
      type: String,
      trim: true
   },
   sessionNumber: {
      type: Number,
      required: [true, 'Session number is required'],
      min: 1
   },
   date: {
      type: Date,
      required: [true, 'Session date is required']
   },
   startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
   },
   endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
   },
   room: {
      type: String,
      trim: true
   },
   teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
   },
   materials: [{
      name: String,
      url: String,
      uploadedAt: {
         type: Date,
         default: Date.now
      }
   }],
   notes: {
      type: String,
      trim: true
   }
}, {
   timestamps: true
});

// Compound index for class sessions
sessionSchema.index({ class: 1, sessionNumber: 1 }, { unique: true });
sessionSchema.index({ class: 1, date: 1 });
sessionSchema.index({ teacher: 1, date: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
