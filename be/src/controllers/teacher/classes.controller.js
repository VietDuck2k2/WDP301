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

      // Filter out any potential nulls if a class was deleted but membership wasn't cleaned up
      const classes = memberships.map(m => m.class).filter(c => c);
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

      // Security check: Verify the teacher is assigned to this class
      const isTeacher = await ClassMember.exists({
         class: classId,
         user: teacherId,
         role: 'teacher',
         status: 'active'
      });

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

      // Security check: Verify the teacher is assigned to this class
      const isTeacher = await ClassMember.exists({
         class: classId,
         user: teacherId,
         role: 'teacher',
         status: 'active'
      });

      if (!isTeacher) {
         throw ApiError.forbidden('Chỉ giáo viên của lớp mới được xem danh sách học sinh.');
      }

      const rawMembers = await ClassMember.find({
         class: classId,
         role: 'student',
         status: 'active'
      }).populate('user', 'firstName lastName email phoneNumber code avatar');

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

      const isTeacher = await ClassMember.exists({
         class: classId,
         user: teacherId,
         role: 'teacher',
         status: 'active'
      });

      if (!isTeacher) {
         throw ApiError.forbidden('Bạn không có quyền xem buổi học của lớp này.');
      }

      const sessions = await Session.find({ class: classId })
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
