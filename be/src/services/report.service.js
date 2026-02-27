const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const ClassMember = require('../models/ClassMember');
const Class = require('../models/Class');

/**
 * Generate attendance report for a class or date range
 */
const getAttendanceReport = async (filters = {}) => {
   const { classId, startDate, endDate, period } = filters;

   // Build date range
   let dateFilter = {};
   if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
   } else if (period === 'week') {
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (now.getDay() || 7) + 1);
      monday.setHours(0, 0, 0, 0);
      dateFilter = { $gte: monday };
   } else if (period === 'month') {
      const now = new Date();
      dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
   }

   // Find sessions
   const sessionQuery = {};
   if (classId) sessionQuery.class = classId;
   if (Object.keys(dateFilter).length > 0) sessionQuery.date = dateFilter;

   const sessions = await Session.find(sessionQuery)
      .populate('class', 'name code')
      .select('title date class');

   const sessionIds = sessions.map(s => s._id);

   // Get all attendance records for those sessions
   const attendances = await Attendance.find({ session: { $in: sessionIds } })
      .populate('student', 'firstName lastName email')
      .populate('session', 'title date');

   // Aggregate by class
   const classStats = {};
   for (const session of sessions) {
      const classKey = session.class._id.toString();
      if (!classStats[classKey]) {
         classStats[classKey] = {
            class: session.class,
            sessions: 0,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
         };
      }
      classStats[classKey].sessions++;
   }

   for (const att of attendances) {
      if (!att.session?.class) continue;
      // Find the class of this session
      const session = sessions.find(s => s._id.toString() === att.session._id.toString());
      if (!session) continue;
      const classKey = session.class._id.toString();
      if (!classStats[classKey]) continue;
      classStats[classKey].total++;
      classStats[classKey][att.status]++;
   }

   const classReports = Object.values(classStats).map(stat => ({
      ...stat,
      attendanceRate: stat.total > 0
         ? (((stat.present + stat.late) / stat.total) * 100).toFixed(1)
         : '0.0'
   }));

   return { classReports, totalSessions: sessions.length, totalRecords: attendances.length };
};

/**
 * Generate assignment/grade report for a class
 */
const getAssignmentReport = async (filters = {}) => {
   const { classId } = filters;

   const assignmentQuery = { status: { $in: ['published', 'closed'] } };
   if (classId) assignmentQuery.class = classId;

   const assignments = await Assignment.find(assignmentQuery)
      .populate('class', 'name code')
      .select('title class maxScore status dueDate');

   const results = [];
   for (const assignment of assignments) {
      const submissions = await Submission.find({ assignment: assignment._id, status: 'graded' })
         .select('score student');

      const scores = submissions.map(s => s.score).filter(s => s != null);
      const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
      const highest = scores.length > 0 ? Math.max(...scores) : null;
      const lowest = scores.length > 0 ? Math.min(...scores) : null;

      // Count students in class
      const enrolled = assignment.class ? await ClassMember.countDocuments({
         class: assignment.class._id,
         role: 'student',
         status: 'active'
      }) : 0;

      results.push({
         assignment: {
            _id: assignment._id,
            title: assignment.title,
            class: assignment.class,
            maxScore: assignment.maxScore,
            dueDate: assignment.dueDate
         },
         stats: {
            enrolled,
            submitted: submissions.length,
            submissionRate: enrolled > 0 ? ((submissions.length / enrolled) * 100).toFixed(1) : '0.0',
            averageScore: avg ? parseFloat(avg) : null,
            highestScore: highest,
            lowestScore: lowest,
            averagePercentage: avg && assignment.maxScore > 0
               ? ((parseFloat(avg) / assignment.maxScore) * 100).toFixed(1)
               : null
         }
      });
   }

   return { assignmentReports: results, totalAssignments: assignments.length };
};

/**
 * Overview stats for the system
 */
const getOverviewReport = async () => {
   const [
      totalClasses,
      activeClasses,
      totalSessions,
      completedSessions,
      totalSubmissions,
      gradedSubmissions
   ] = await Promise.all([
      Class.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true, status: 'active' }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      Submission.countDocuments({ status: { $in: ['submitted', 'graded'] } }),
      Submission.countDocuments({ status: 'graded' })
   ]);

   const allAttendances = await Attendance.find().select('status');
   const presentCount = allAttendances.filter(a => a.status === 'present' || a.status === 'late').length;
   const overallRate = allAttendances.length > 0
      ? ((presentCount / allAttendances.length) * 100).toFixed(1)
      : '0.0';

   return {
      classes: { total: totalClasses, active: activeClasses },
      sessions: { total: totalSessions, completed: completedSessions },
      assignments: { totalSubmissions, gradedSubmissions },
      attendance: {
         totalRecords: allAttendances.length,
         presentCount,
         overallRate: parseFloat(overallRate)
      }
   };
};

module.exports = {
   getAttendanceReport,
   getAssignmentReport,
   getOverviewReport
};
