const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const ClassMember = require('../models/ClassMember');
const ApiError = require('../utils/apiError');

/**
 * Verify teacher is assigned to the session's class
 */
const verifyTeacherClassMembership = async (sessionId, teacherId) => {
   const session = await Session.findById(sessionId);
   if (!session) throw ApiError.notFound('Session not found');

   // New rule: teacher can access if either:
   // - they are assigned to the class (ClassMember), OR
   // - they are assigned to THIS session via session.teacher (per-session assignment)
   if (session.teacher && session.teacher.toString() === teacherId.toString()) {
      return session;
   }

   const membership = await ClassMember.findOne({
      class: session.class,
      user: teacherId,
      role: 'teacher',
      status: 'active'
   });

   if (!membership) {
      throw ApiError.forbidden('Bạn không có quyền xem thông tin buổi học này.');
   }
   return session;
};

/**
 * Verify teacher attendance permission
 */
const verifyTeacherAttendancePermission = async (sessionId, teacherId) => {
   const session = await verifyTeacherClassMembership(sessionId, teacherId);

   // Verify 24h window
   if (session.date && session.startTime) {
      const [hours, minutes] = session.startTime.split(':').map(Number);

      // Parse session date correctly without timezone shift
      const dStr = session.date instanceof Date ? session.date.toISOString().split('T')[0] : String(session.date).split('T')[0];
      const parts = dStr.split('-');
      const sessionStart = parts.length === 3
         ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), hours, minutes, 0, 0)
         : new Date(session.date);

      if (parts.length !== 3) {
         sessionStart.setHours(hours, minutes, 0, 0);
      }

      const now = new Date();
      const diffMs = now.getTime() - sessionStart.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 0) {
         throw ApiError.forbidden('Chưa đến giờ điểm danh cho buổi học này.');
      }

      if (diffHours > 24) {
         throw ApiError.forbidden('Chỉ được chỉnh sửa điểm danh trong vòng 24 giờ kể từ khi buổi học bắt đầu.');
      }
   }
};

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
      .populate('student', 'firstName lastName email phone')
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
   }).populate('user', 'firstName lastName email phone');

   // Get attendance records for this session
   const attendanceRecords = await Attendance.find({ session: sessionId })
      .populate('student', 'firstName lastName email phone');

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
      absent: records.filter(r => r.status === 'absent').length
   };

   summary.attendanceRate = summary.total > 0
      ? (summary.present / summary.total * 100).toFixed(2)
      : 0;

   return summary;
};

module.exports = {
   getAttendanceRecords,
   getSessionAttendance,
   markAttendance,
   bulkMarkAttendance,
   getStudentAttendanceSummary,
   verifyTeacherAttendancePermission,
   verifyTeacherClassMembership
};
