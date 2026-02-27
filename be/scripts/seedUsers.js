const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config({ path: __dirname + '/../.env' }); // Load .env file

const connectDB = async () => {
   try {
      const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecms');
      console.log(`MongoDB Connected: ${conn.connection.host}`);
   } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      process.exit(1);
   }
};

const seedUsers = async () => {
   try {
      await connectDB();

      const count = await User.countDocuments();
      if (count > 0) {
         console.log('Clearing existing users for a fresh seed...');
         await User.deleteMany({});
      }

      console.log('Seeding default users...');

      const defaultUsers = [
         {
            email: 'admin@example.com',
            password: 'password123',
            firstName: 'System',
            lastName: 'Admin',
            role: 'admin'
         },
         {
            email: 'teacher@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'teacher'
         },
         {
            email: 'student@example.com',
            password: 'password123',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'student'
         }
      ];

      for (const user of defaultUsers) {
         await User.create(user);
      }

      console.log('✅ Default users created successfully!');
      console.log('You can now log in with the following accounts (all passwords are: password123):');
      console.log('👨‍💼 Admin: admin@example.com');
      console.log('👨‍🏫 Teacher: teacher@example.com');
      console.log('👨‍🎓 Student: student@example.com');

      process.exit(0);
   } catch (error) {
      console.error(`Error seeding users: ${error.message}`);
      process.exit(1);
   }
};

seedUsers();
