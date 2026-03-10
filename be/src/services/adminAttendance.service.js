const Attendance = require('../models/Attendance');
const attendanceService = require('./attendance.service');
const ApiError = require('../utils/apiError');

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
         .populate('student', 'firstName lastName email')
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
   getAllAttendances,
   updateAttendance,
   deleteAttendance
};
