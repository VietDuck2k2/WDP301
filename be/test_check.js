const mongoose = require('mongoose');
const User = require('./src/models/User');
const ClassMember = require('./src/models/ClassMember');
const Class = require('./src/models/Class');
require('dotenv').config();

async function check() {
   try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to DB');

      const student = await User.findOne({ role: 'student' });
      if (!student) {
         console.log('No student found in User collection');
         process.exit();
      }
      console.log('Found Student:', student.email, 'ID:', student._id);

      const memberships = await ClassMember.find({ user: student._id });
      console.log('Class Memberships:', memberships.length);
      memberships.forEach(m => console.log(' - ClassID:', m.class, 'Status:', m.status, 'Role:', m.role));

      const activeClasses = await Class.find({ isActive: true });
      console.log('Total Active Classes:', activeClasses.length);
      if (activeClasses.length > 0) {
         console.log('Sample Class status:', activeClasses[0].status);
      }

   } catch (err) {
      console.error('Error:', err);
   } finally {
      process.exit();
   }
}

check();
