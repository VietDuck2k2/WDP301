const User = require('../models/User');
const Class = require('../models/Class');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');

/**
 * Get admin dashboard overview stats
 */
const getDashboardStats = async () => {
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const tomorrow = new Date(today);
   tomorrow.setDate(today.getDate() + 1);

   // Get Monday of current week
   const dayOfWeek = today.getDay();
   const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
   const weekStart = new Date(today);
   weekStart.setDate(today.getDate() + mondayOffset);
   const weekEnd = new Date(weekStart);
   weekEnd.setDate(weekStart.getDate() + 7);

   const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      activeClasses,
      todaySessions,
      weekAttendances
   ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      Class.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true, status: 'active' }),
      Session.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Attendance.find({
         markedAt: { $gte: weekStart, $lt: weekEnd }
      }).select('status')
   ]);

   const weekTotal = weekAttendances.length;
   const weekPresent = weekAttendances.filter(a => a.status === 'present' || a.status === 'late').length;
   const weekAttendanceRate = weekTotal > 0
      ? ((weekPresent / weekTotal) * 100).toFixed(1)
      : 0;

   // Recent sessions (last 5)
   const recentSessions = await Session.find()
      .populate('class', 'name code')
      .sort({ date: -1, startTime: -1 })
      .limit(5)
      .select('title date startTime endTime status class room');

   return {
      users: {
         total: totalUsers,
         teachers: totalTeachers,
         students: totalStudents
      },
      classes: {
         total: totalClasses,
         active: activeClasses
      },
      sessions: {
         today: todaySessions
      },
      attendance: {
         weekTotal,
         weekPresent,
         weekAttendanceRate: parseFloat(weekAttendanceRate)
      },
      recentSessions
   };
};

module.exports = {
   getDashboardStats
};
