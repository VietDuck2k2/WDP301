const Attendance = require('../models/Attendance');
const attendanceService = require('./attendance.service');
const ApiError = require('../utils/apiError');
const Session = require('../models/Session');
const ClassMember = require('../models/ClassMember');

/**
 * Get all attendance records (admin only, with filters)
 */
const getAllAttendances = async (filters = {}) => {
   const { sessionId, studentId, classId, status, page = 1, limit = 50 } = filters;

   const query = {};
   if (sessionId) query.session = sessionId;
   if (studentId) query.student = studentId;
   if (status) query.status = status;

   if (classId) {
      const Session = require('../models/Session');
      const sessions = await Session.find({ class: classId }).select('_id');
      query.session = { $in: sessions.map(s => s._id) };
   }

   const skip = (page - 1) * limit;

   const [records, total] = await Promise.all([
      Attendance.find(query)
         .populate('session', 'title date startTime endTime')
         .populate('student', 'firstName lastName email phone')
         .populate('markedBy', 'firstName lastName')
         .sort({ markedAt: -1 })
         .skip(skip)
         .limit(parseInt(limit)),
      Attendance.countDocuments(query)
   ]);

   return {
      records,
      pagination: {
         page: parseInt(page),
         limit: parseInt(limit),
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

/**
 * Update an attendance record (admin correction)
 */
const updateAttendance = async (attendanceId, updateData) => {
   const allowedFields = ['status', 'arrivedAt', 'notes'];
   const updates = {};
   allowedFields.forEach(f => { if (updateData[f] !== undefined) updates[f] = updateData[f]; });

   const record = await Attendance.findByIdAndUpdate(
      attendanceId,
      updates,
      { new: true, runValidators: true }
   ).populate('session student markedBy');

   if (!record) throw ApiError.notFound('Attendance record not found');
   return record;
};

/**
 * Delete an attendance record (admin hard delete)
 */
const deleteAttendance = async (attendanceId) => {
   const record = await Attendance.findByIdAndDelete(attendanceId);
   if (!record) throw ApiError.notFound('Attendance record not found');
   return record;
};

module.exports = {
   ...require('./attendance.service'),
   // Admin view: do NOT default missing records to "absent".
   // This allows "tương lai / chưa điểm danh" to stay blank and still be editable.
   getSessionAttendance: async (sessionId) => {
      const session = await Session.findById(sessionId).populate('class');
      if (!session) throw ApiError.notFound('Session not found');

      const classMembers = await ClassMember.find({
         class: session.class._id,
         role: 'student',
         status: 'active'
      }).populate('user', 'firstName lastName email phone code');

      const attendanceRecords = await Attendance.find({ session: sessionId })
         .populate('student', 'firstName lastName email phone code');

      const byStudentId = new Map();
      attendanceRecords.forEach((r) => {
         byStudentId.set(r.student?._id?.toString(), r);
      });

      return classMembers.map((member) => {
         const uid = member.user?._id?.toString();
         const record = uid ? byStudentId.get(uid) : null;
         return {
            _id: record?._id || null,
            student: member.user,
            status: record ? (record.status || null) : null,
            arrivedAt: record?.arrivedAt || null,
            notes: record?.notes || null,
            markedAt: record?.markedAt || null
         };
      });
   },
   getAllAttendances,
   updateAttendance,
   deleteAttendance
};
