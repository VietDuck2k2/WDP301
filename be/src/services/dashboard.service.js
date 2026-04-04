const User = require('../models/User');
const Class = require('../models/Class');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');

const MONTH_LABELS_VI = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const parseYear = (yearInput) => {
   const current = new Date().getFullYear();
   const n = parseInt(yearInput, 10);
   if (!Number.isFinite(n) || n < 2000 || n > current + 1) return current;
   return n;
};

const mapAggToMonthlyCounts = (agg) => {
   const counts = Array(12).fill(0);
   agg.forEach(({ _id, count }) => {
      if (_id >= 1 && _id <= 12) counts[_id - 1] = count;
   });
   return counts;
};

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

   // Most recently created classes (last 5) — same visibility as admin class list: chỉ lớp đang active
   const recentClasses = await Class.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name code level capacity status startDate endDate createdAt');

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
      recentClasses
   };
};

/**
 * Monthly new registrations: teachers & students in a calendar year (by createdAt).
 */
const getMonthlyUserGrowth = async (yearInput) => {
   const year = parseYear(yearInput);
   const start = new Date(Date.UTC(year, 0, 1));
   const end = new Date(Date.UTC(year + 1, 0, 1));

   const [teachersAgg, studentsAgg] = await Promise.all([
      User.aggregate([
         { $match: { role: 'teacher', createdAt: { $gte: start, $lt: end } } },
         { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
      ]),
      User.aggregate([
         { $match: { role: 'student', createdAt: { $gte: start, $lt: end } } },
         { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
      ])
   ]);

   const teachers = mapAggToMonthlyCounts(teachersAgg);
   const students = mapAggToMonthlyCounts(studentsAgg);

   const usersByMonth = MONTH_LABELS_VI.map((label, i) => ({
      month: i + 1,
      label,
      teachers: teachers[i],
      students: students[i]
   }));

   return { year, usersByMonth };
};

/**
 * Classes created per month in a calendar year (by createdAt).
 */
const getMonthlyClassCreations = async (yearInput) => {
   const year = parseYear(yearInput);
   const start = new Date(Date.UTC(year, 0, 1));
   const end = new Date(Date.UTC(year + 1, 0, 1));

   const agg = await Class.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
   ]);

   const counts = mapAggToMonthlyCounts(agg);

   const classesByMonth = MONTH_LABELS_VI.map((label, i) => ({
      month: i + 1,
      label,
      classes: counts[i]
   }));

   return { year, classesByMonth };
};

const getMonthlyCharts = async (yearInput) => {
   const year = parseYear(yearInput);
   const [userBlock, classBlock] = await Promise.all([
      getMonthlyUserGrowth(year),
      getMonthlyClassCreations(year)
   ]);
   return {
      year: userBlock.year,
      usersByMonth: userBlock.usersByMonth,
      classesByMonth: classBlock.classesByMonth
   };
};

module.exports = {
   getDashboardStats,
   getMonthlyCharts
};
