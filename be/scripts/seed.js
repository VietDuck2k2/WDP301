/**
 * Full Seed Script — English Center Manager System
 *
 * Creates demo data for FE development and testing:
 *   - 1 Admin, 2 Teachers, 5 Students
 *   - 2 Classes with teacher + students enrolled
 *   - 8 Sessions per class (past + upcoming)
 *   - 2 Assignments per class (1 published, 1 draft)
 *   - Student submissions + grades
 *   - Attendance records for past sessions
 *   - 2 Announcements per class
 *
 * Usage: node scripts/seed.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Class = require('../src/models/Class');
const ClassMember = require('../src/models/ClassMember');
const Session = require('../src/models/Session');
const Assignment = require('../src/models/Assignment');
const Submission = require('../src/models/Submission');
const Attendance = require('../src/models/Attendance');
const Announcement = require('../src/models/Announcement');

// ─── helpers ────────────────────────────────────────────────────────────────
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

// ─── connect ─────────────────────────────────────────────────────────────────
async function connect() {
   const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecms';
   await mongoose.connect(uri);
   console.log('✅ MongoDB connected');
}

// ─── clear ───────────────────────────────────────────────────────────────────
async function clearAll() {
   await Promise.all([
      User.deleteMany({}),
      Class.deleteMany({}),
      ClassMember.deleteMany({}),
      Session.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Attendance.deleteMany({}),
      Announcement.deleteMany({}),
   ]);
   console.log('🗑️  Cleared all collections');
}

// ─── seed ────────────────────────────────────────────────────────────────────
async function seed() {
   // ── Users ──────────────────────────────────────────────────────────────
   const [admin, teacher1, teacher2, ...students] = await User.create([
      { firstName: 'System', lastName: 'Admin', email: 'admin@ecms.com', password: '123456', role: 'admin' },
      { firstName: 'John', lastName: 'Smith', email: 'teacher1@ecms.com', password: '123456', role: 'teacher' },
      { firstName: 'Emily', lastName: 'Clark', email: 'teacher2@ecms.com', password: '123456', role: 'teacher' },
      { firstName: 'Alice', lastName: 'Nguyen', email: 'student1@ecms.com', password: '123456', role: 'student' },
      { firstName: 'Bob', lastName: 'Tran', email: 'student2@ecms.com', password: '123456', role: 'student' },
      { firstName: 'Charlie', lastName: 'Le', email: 'student3@ecms.com', password: '123456', role: 'student' },
      { firstName: 'Diana', lastName: 'Pham', email: 'student4@ecms.com', password: '123456', role: 'student' },
      { firstName: 'Edward', lastName: 'Hoang', email: 'student5@ecms.com', password: '123456', role: 'student' },
   ]);
   // Same accounts as seedUsers.js so login works with admin@example.com / password123
   await User.create([
      { firstName: 'System', lastName: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' },
      { firstName: 'John', lastName: 'Doe', email: 'teacher@example.com', password: 'password123', role: 'teacher' },
      { firstName: 'Jane', lastName: 'Smith', email: 'student@example.com', password: 'password123', role: 'student' },
   ]);
   console.log('👤 Users created');

   // ── Classes ─────────────────────────────────────────────────────────────
   const [classA, classB] = await Class.create([
      {
         name: 'IELTS Advanced',
         code: 'IELTS-ADV-01',
         description: 'Advanced IELTS preparation course targeting Band 7+',
         level: 'advanced',
         capacity: 20,
         startDate: daysAgo(30),
         endDate: daysFrom(60),
         room: 'A101',
         status: 'active',
      },
      {
         name: 'Business English',
         code: 'BIZ-ENG-01',
         description: 'Professional business communication and workplace English',
         level: 'upper-intermediate',
         capacity: 15,
         startDate: daysAgo(20),
         endDate: daysFrom(70),
         room: 'B202',
         status: 'active',
      },
   ]);
   console.log('🏫 Classes created');

   // ── Class Members ────────────────────────────────────────────────────────
   // classA: teacher1 + students 1-3
   // classB: teacher2 + students 3-5
   await ClassMember.create([
      { class: classA._id, user: teacher1._id, role: 'teacher' },
      { class: classA._id, user: students[0]._id, role: 'student' },
      { class: classA._id, user: students[1]._id, role: 'student' },
      { class: classA._id, user: students[2]._id, role: 'student' },

      { class: classB._id, user: teacher2._id, role: 'teacher' },
      { class: classB._id, user: students[2]._id, role: 'student' },
      { class: classB._id, user: students[3]._id, role: 'student' },
      { class: classB._id, user: students[4]._id, role: 'student' },
   ]);
   console.log('👥 Class members enrolled');

   // ── Sessions ─────────────────────────────────────────────────────────────
   // Helper: create sessions for a class
   const makeSessions = (cls, teacher, offsetDays) => {
      const sessions = [];
      for (let i = 1; i <= 8; i++) {
         const dayOffset = offsetDays + (i - 1) * 3; // every 3 days
         const isPast = dayOffset < 0;
         const isToday = dayOffset === 0;
         sessions.push({
            class: cls._id,
            teacher: teacher._id,
            title: `Session ${i}`,
            sessionNumber: i,
            date: daysAgo(-dayOffset),
            startTime: '08:00',
            endTime: '10:00',
            room: cls.room,
            status: isPast ? 'completed' : isToday ? 'ongoing' : 'scheduled',
            notes: isPast ? `Class notes for session ${i}` : '',
         });
      }
      return sessions;
   };

   const sessionsA = await Session.create(makeSessions(classA, teacher1, -18));
   const sessionsB = await Session.create(makeSessions(classB, teacher2, -12));
   console.log('📅 Sessions created');

   // ── Attendance (past sessions only) ─────────────────────────────────────
   const attendanceStatuses = ['present', 'present', 'present', 'late', 'absent'];
   const classAStudents = [students[0], students[1], students[2]];
   const classBStudents = [students[2], students[3], students[4]];
   const pastSessionsA = sessionsA.filter(s => s.status === 'completed');
   const pastSessionsB = sessionsB.filter(s => s.status === 'completed');

   const attendanceDocs = [];
   for (const session of pastSessionsA) {
      classAStudents.forEach((student, idx) => {
         attendanceDocs.push({
            session: session._id,
            student: student._id,
            markedBy: teacher1._id,
            status: attendanceStatuses[idx % attendanceStatuses.length],
            markedAt: session.date,
         });
      });
   }
   for (const session of pastSessionsB) {
      classBStudents.forEach((student, idx) => {
         attendanceDocs.push({
            session: session._id,
            student: student._id,
            markedBy: teacher2._id,
            status: attendanceStatuses[(idx + 1) % attendanceStatuses.length],
            markedAt: session.date,
         });
      });
   }
   await Attendance.create(attendanceDocs);
   console.log('✔️  Attendance records created');

   // ── Assignments ──────────────────────────────────────────────────────────
   const [asgn1, asgn2, asgn3, asgn4] = await Assignment.create([
      {
         class: classA._id, createdBy: teacher1._id,
         title: 'Grammar Exercise Unit 5', description: 'Complete exercises on passive voice',
         instructions: 'Submit as PDF. Show all workings.',
         dueDate: daysFrom(5), maxScore: 100, status: 'published', publishedAt: daysAgo(3),
      },
      {
         class: classA._id, createdBy: teacher1._id,
         title: 'Reading Comprehension Test', description: 'Read the passage and answer 20 questions',
         instructions: 'Answer all questions. 2 points each.',
         dueDate: daysFrom(14), maxScore: 40, status: 'draft',
      },
      {
         class: classB._id, createdBy: teacher2._id,
         title: 'Business Email Writing', description: 'Write a formal business email to a client',
         instructions: 'Minimum 150 words. Use formal register.',
         dueDate: daysFrom(7), maxScore: 50, status: 'published', publishedAt: daysAgo(2),
      },
      {
         class: classB._id, createdBy: teacher2._id,
         title: 'Presentation Script', description: 'Draft a 5-minute pitch for a product launch',
         instructions: 'Include opening, body, and closing. Min 300 words.',
         dueDate: daysFrom(20), maxScore: 100, status: 'draft',
      },
   ]);
   console.log('📝 Assignments created');

   // ── Submissions + Grades ─────────────────────────────────────────────────
   // students[0] and students[1] submitted + graded for asgn1
   // students[2] submitted (not graded) for asgn3
   await Submission.create([
      {
         assignment: asgn1._id, student: students[0]._id,
         content: 'My answers: 1.b 2.c 3.a 4.d 5.b — Here is my explanation for each...',
         status: 'graded', score: 88, feedback: 'Excellent work! Minor issues with question 3.',
         gradedBy: teacher1._id, gradedAt: daysAgo(1), submittedAt: daysAgo(2),
      },
      {
         assignment: asgn1._id, student: students[1]._id,
         content: 'Here are my answers to the passive voice exercises...',
         status: 'graded', score: 74, feedback: 'Good effort. Review rules for perfect passive.',
         gradedBy: teacher1._id, gradedAt: daysAgo(1), submittedAt: daysAgo(3),
      },
      {
         assignment: asgn3._id, student: students[2]._id,
         content: 'Dear Mr. Johnson, I am writing to follow up on our previous meeting...',
         status: 'submitted', submittedAt: daysAgo(1),
      },
   ]);
   console.log('📤 Submissions created');

   // ── Announcements ────────────────────────────────────────────────────────
   await Announcement.create([
      {
         class: classA._id, createdBy: teacher1._id,
         title: 'Midterm Exam Schedule',
         content: 'The midterm exam will be held on ' + daysFrom(10).toDateString() + ' in Room A101. Please bring your student ID and a pencil. The exam covers Units 1-5.',
         priority: 'urgent', isPinned: true, isPublished: true,
      },
      {
         class: classA._id, createdBy: teacher1._id,
         title: 'Extra Study Materials',
         content: 'I have uploaded additional grammar exercises to the class portal. These are optional but highly recommended before the midterm.',
         priority: 'normal', isPinned: false, isPublished: true,
      },
      {
         class: classB._id, createdBy: teacher2._id,
         title: 'Guest Speaker Next Week',
         content: 'We will have a guest speaker from a multinational company on ' + daysFrom(7).toDateString() + '. Attendance is mandatory. Please prepare 2 questions in advance.',
         priority: 'high', isPinned: true, isPublished: true,
      },
      {
         class: classB._id, createdBy: teacher2._id,
         title: 'Assignment Submission Reminder',
         content: 'The Business Email Writing assignment is due in 1 week. Make sure to proofread before submitting.',
         priority: 'normal', isPinned: false, isPublished: true,
      },
   ]);
   console.log('📢 Announcements created');
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
   await connect();
   await clearAll();
   await seed();

   console.log('\n✅ Seed complete! Test accounts:');
   console.log('──────────────────────────────────────────────────');
   console.log('(password: 123456)');
   console.log('👨‍💼 Admin:    admin@ecms.com');
   console.log('👨‍🏫 Teacher1: teacher1@ecms.com  (IELTS Advanced)');
   console.log('👩‍🏫 Teacher2: teacher2@ecms.com  (Business English)');
   console.log('👨‍🎓 Student1–5: student1@ecms.com … student5@ecms.com');
   console.log('(password: password123)');
   console.log('👨‍💼 Admin:    admin@example.com');
   console.log('👨‍🏫 Teacher:  teacher@example.com');
   console.log('👨‍🎓 Student:  student@example.com');
   console.log('──────────────────────────────────────────────────');

   await mongoose.disconnect();
   process.exit(0);
}

main().catch(err => {
   console.error('❌ Seed failed:', err.message);
   process.exit(1);
});
