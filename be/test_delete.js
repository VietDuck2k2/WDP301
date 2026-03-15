require('dotenv').config();
const mongoose = require('mongoose');
const classService = require('./src/services/class.service');
const Class = require('./src/models/Class');

async function testDelete() {
   await mongoose.connect(process.env.MONGO_URI);
   console.log('Connected to DB');

   const testClass = await Class.findOne({ isActive: true });
   if (!testClass) {
      console.log('No active class found');
      process.exit(0);
   }

   console.log('Found class to delete:', testClass.name, testClass._id);

   try {
      const res = await classService.deleteClass(testClass._id.toString());
      console.log('Delete result:', res.isActive);
   } catch (error) {
      console.error('Delete error:', error);
   }

   process.exit(0);
}

testDelete();
