const ClassType = require('../../models/Class');
const ClassMember = require('../../models/ClassMember');
const Session = require('../../models/Session');
const User = require('../../models/User');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

/**
 * @route   GET /api/teacher/classes
 * @desc    Get list of classes taught by the authenticated teacher
 * @access  Private/Teacher
 */
const getMyClasses = async (req, res, next) => {
   try {
      const teacherId = req.user._id;

      const memberships = await ClassMember.find({
         user: teacherId,
         role: 'teacher',
         status: 'active'
      }).populate('class');

      const memberClasses = memberships.map(m => m.class).filter(c => c);

      // Also include classes where teacher is assigned to any session (per-session assignment)
      const sessionClassIds = await Session.find({ teacher: teacherId })
         .distinct('class');

      const extraClasses = await ClassType.find({ _id: { $in: sessionClassIds } });

      const classMap = new Map();
      [...memberClasses, ...extraClasses].forEach((c) => {
         if (c?._id) classMap.set(c._id.toString(), c);
      });
      const classes = Array.from(classMap.values());
      ApiResponse.ok(res, classes);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/classes/:classId
 * @desc    Get class details
 * @access  Private/Teacher
 */
const getClassById = async (req, res, next) => {
   try {
      const { classId } = req.params;
      const teacherId = req.user._id;

      // Security check: allow if teacher is class member OR has any session in this class
      const isTeacher = await ClassMember.exists({
         class: classId,
         user: teacherId,
         role: 'teacher',
         status: 'active'
      }) || await Session.exists({ class: classId, teacher: teacherId });

      if (!isTeacher) {
         throw ApiError.forbidden('Bạn không có quyền xem thông tin lớp này.');
      }

      const classInfo = await ClassType.findById(classId).populate('scheduleTemplate');
      
      if (!classInfo) {
         throw ApiError.notFound('Không tìm thấy thông tin lớp học.');
      }

      ApiResponse.ok(res, classInfo);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/classes/:classId/students
 * @desc    Get list of active students in a specific class
 * @access  Private/Teacher
 */
const getClassStudents = async (req, res, next) => {
   try {
      const { classId } = req.params;
      const teacherId = req.user._id;

      // Security check: allow if teacher is class member OR has any session in this class
      const isTeacher = await ClassMember.exists({
         class: classId,
         user: teacherId,
         role: 'teacher',
         status: 'active'
      }) || await Session.exists({ class: classId, teacher: teacherId });

      if (!isTeacher) {
         throw ApiError.forbidden('Chỉ giáo viên của lớp mới được xem danh sách học sinh.');
      }

      const rawMembers = await ClassMember.find({
         class: classId,
         role: 'student',
         status: 'active'
      }).populate('user', 'firstName lastName email phone code avatar');

      const students = rawMembers.map(m => m.user);
      ApiResponse.ok(res, students);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/classes/:classId/sessions
 * @desc    Get sessions for a class
 * @access  Private/Teacher
 */
const getSessionsByClassId = async (req, res, next) => {
   try {
      const { classId } = req.params;
      const teacherId = req.user._id;

      // For per-session teacher assignment: only return sessions taught by this teacher
      // (If teacher is also class member, they still only see their sessions here)
      const isTeacher = await ClassMember.exists({
         class: classId,
         user: teacherId,
         role: 'teacher',
         status: 'active'
      }) || await Session.exists({ class: classId, teacher: teacherId });

      if (!isTeacher) {
         throw ApiError.forbidden('Bạn không có quyền xem buổi học của lớp này.');
      }

      const sessions = await Session.find({ class: classId, teacher: teacherId })
         .sort({ date: 1, startTime: 1 });

      ApiResponse.ok(res, sessions);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyClasses,
   getClassById,
   getClassStudents,
   getSessionsByClassId
};
