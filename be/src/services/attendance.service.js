const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const ClassMember = require('../models/ClassMember');
const ApiError = require('../utils/apiError');

/**
 * Get attendance records with filters
 */
const getAttendanceRecords = async (filters = {}) => {
   const { sessionId, studentId, status } = filters;

   const query = {};

   if (sessionId) query.session = sessionId;
   if (studentId) query.student = studentId;
   if (status) query.status = status;

   const records = await Attendance.find(query)
      .populate('session', 'title date')
      .populate('student', 'firstName lastName email')
      .populate('markedBy', 'firstName lastName')
      .sort({ markedAt: -1 });

   return records;
};

/**
 * Get attendance for a session
 */
const getSessionAttendance = async (sessionId) => {
   const session = await Session.findById(sessionId).populate('class');

   if (!session) {
      throw ApiError.notFound('Session not found');
   }

   // Get all students in the class
   const classMembers = await ClassMember.find({
      class: session.class._id,
      role: 'student',
      status: 'active'
   }).populate('user', 'firstName lastName email');

   // Get attendance records for this session
   const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate('student', 'firstName lastName email');

   // Merge data
   const attendance = classMembers.map(member => {
      const record = attendanceRecords.find(
         r => r.student._id.toString() === member.user._id.toString()
      );

      return {
         student: member.user,
         status: record?.status || 'absent',
         arrivedAt: record?.arrivedAt || null,
         notes: record?.notes || null,
         markedAt: record?.markedAt || null
      };
   });

   return attendance;
};

/**
 * Mark attendance
 */
const markAttendance = async (sessionId, studentId, attendanceData, markedBy) => {
   const session = await Session.findById(sessionId);

   if (!session) {
      throw ApiError.notFound('Session not found');
   }

   // Verify student is enrolled in the class
   const enrollment = await ClassMember.findOne({
      class: session.class,
      user: studentId,
      role: 'student',
      status: 'active'
   });

   if (!enrollment) {
      throw ApiError.badRequest('Student not enrolled in this class');
   }

   // Create or update attendance record
   const attendance = await Attendance.findOneAndUpdate(
      { session: sessionId, student: studentId },
      {
         status: attendanceData.status,
         arrivedAt: attendanceData.arrivedAt,
         notes: attendanceData.notes,
         markedBy,
         markedAt: new Date()
      },
      { upsert: true, new: true, runValidators: true }
   );

   return attendance;
};

/**
 * Bulk mark attendance
 */
const bulkMarkAttendance = async (sessionId, attendanceList, markedBy) => {
   const session = await Session.findById(sessionId);

   if (!session) {
      throw ApiError.notFound('Session not found');
   }

   const results = [];

   for (const item of attendanceList) {
      try {
         const attendance = await markAttendance(
            sessionId,
            item.studentId,
            { status: item.status, notes: item.notes },
            markedBy
         );
         results.push({ success: true, studentId: item.studentId, attendance });
      } catch (error) {
         results.push({ success: false, studentId: item.studentId, error: error.message });
      }
   }

   return results;
};

/**
 * Get student attendance summary
 */
const getStudentAttendanceSummary = async (studentId, classId = null) => {
   const query = { student: studentId };

   if (classId) {
      const sessions = await Session.find({ class: classId }).select('_id');
      query.session = { $in: sessions.map(s => s._id) };
   }

   const records = await Attendance.find(query);

   const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      excused: records.filter(r => r.status === 'excused').length
   };

   summary.attendanceRate = summary.total > 0
      ? ((summary.present + summary.late) / summary.total * 100).toFixed(2)
      : 0;

   return summary;
};

module.exports = {
   getAttendanceRecords,
   getSessionAttendance,
   markAttendance,
   bulkMarkAttendance,
   getStudentAttendanceSummary
};
