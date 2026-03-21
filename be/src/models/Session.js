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
   slotNumber: {
      type: Number,
      min: 1,
      max: 5,
   },
   startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
   },
   endTime: {
      type: String,
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
   },
   cancelReason: {
      type: String,
      trim: true
   },
   isMakeup: {
      type: Boolean,
      default: false
   },
   makeupForSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
   }
}, {
   timestamps: true
});

// Compound index for class sessions
sessionSchema.index({ class: 1, sessionNumber: 1 }, { unique: true });
sessionSchema.index({ class: 1, date: 1 });
sessionSchema.index({ teacher: 1, date: 1 });

// [IMPROVEMENT] Unique compound index to prevent race-condition double-booking of a room.
// Applies only when: room is not empty AND session is not cancelled.
// This is enforced at the DB level to guard against concurrent requests.
// sparse:true ensures rows with empty room are excluded from uniqueness check.
sessionSchema.index(
   { room: 1, date: 1, slotNumber: 1 },
   {
      unique: true,
      sparse: true,
      partialFilterExpression: {
         room: { $exists: true, $ne: '' },
         status: { $ne: 'cancelled' }
      },
      name: 'room_date_slot_unique'
   }
);

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
