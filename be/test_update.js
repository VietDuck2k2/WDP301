const mongoose = require('mongoose');
const Class = require('./src/models/Class');
const Session = require('./src/models/Session');
require('dotenv').config();

async function test() {
   await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecms');

   const class1 = await Class.findOne({ name: 'DDD' });

   if (class1) {
      const classService = require('./src/services/class.service');
      const sessionService = require('./src/services/session.service');

      console.log('Class DDD before:', class1.startDate, class1.endDate);

      // Simulate updating DDD with its own dates to trigger cleanup
      const reqBody = {
         startDate: class1.startDate.toISOString(),
         endDate: class1.endDate.toISOString(),
         scheduleTemplate: class1.scheduleTemplate,
         room: class1.room,
         capacity: class1.capacity,
         level: class1.level,
         status: class1.status
      };

      const Session = require('./src/models/Session');
      // Delete all scheduled sessions to simulate the new controller behavior
      await Session.deleteMany({ class: class1._id, status: 'scheduled' });

      if (class1.scheduleTemplate) {
         await sessionService.generateSessionsFromTemplate(class1._id, class1.scheduleTemplate);
      }

      const sessions = await Session.find({ class: class1._id }).sort({ date: 1 });
      console.log(`Class DDD now has ${sessions.length} sessions.`);
   }

   process.exit();
}
test();
