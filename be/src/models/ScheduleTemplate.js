const mongoose = require('mongoose');

const scheduleTemplateSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true
   },
   description: {
      type: String,
      trim: true
   },
   schedule: [{
      dayOfWeek: {
         type: Number,
         required: [true, 'Day of week is required'],
         min: 0,
         max: 6,
         // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      },
      slotNumber: {
         type: Number,
         required: [true, 'Slot number is required'],
         min: 1,
         max: 5,
      },
      room: {
         type: String,
         trim: true
      }
   }],
   isActive: {
      type: Boolean,
      default: true
   }
}, {
   timestamps: true
});

// slotNumber is validated via min/max on schema level - no custom validator needed


const ScheduleTemplate = mongoose.model('ScheduleTemplate', scheduleTemplateSchema);

module.exports = ScheduleTemplate;
