const mongoose = require('mongoose');
const classService = require('./be/src/services/class.service');
const sessionService = require('./be/src/services/session.service');
const Class = require('./be/src/models/Class');
require('dotenv').config({ path: './be/.env' });

async function test() {
   await mongoose.connect(process.env.MONGODB_URI);
   console.log('Connected to DB');

   const classes = await Class.find({});
   const class2 = classes.find(c => c.name === 'sdfsdf');

   if (!class2) {
      console.log('Class 2 not found');
      process.exit();
   }

   console.log('Class 2:', class2._id, class2.room, class2.code);

   try {
      const res = await classService.updateClass(class2._id, { room: 'A102' });
      console.log('Success!', res);
   } catch (err) {
      console.error('Error in service:', err.message);
   }

   process.exit();
}
test();
