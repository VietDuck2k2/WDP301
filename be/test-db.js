const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function check() {
   try {
      await mongoose.connect('mongodb://localhost:27017/ecms');
      console.log('Connected to DB');

      const admin = await User.findOne({ email: 'admin@ecms.com' }).select('+password');
      if (!admin) {
         console.log('Admin user not found!');
         return;
      }

      console.log('Admin found:', admin.email);
      console.log('Is Active:', admin.isActive);

      const pwdMatch = await bcrypt.compare('123456', admin.password);
      console.log('Password "123456" matches hash?', pwdMatch);

   } catch (err) {
      console.error(err);
   } finally {
      await mongoose.disconnect();
   }
}

check();
