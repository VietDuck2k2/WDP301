const classService = require('../../services/class.service');
const ClassMember = require('../../models/ClassMember');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

/**
 * @route   GET /api/student/classes
 * @desc    Get student's enrolled classes
 * @access  Private/Student
 */
const getMyClasses = async (req, res, next) => {
   try {
      const result = await classService.getAllClasses(req.query, req.user._id, 'student');
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/classes/:id
 * @desc    Get class by ID
 * @access  Private/Student
 */
const getClassById = async (req, res, next) => {
   try {
      const classData = await classService.getClassById(req.params.id);
      ApiResponse.ok(res, classData);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/classes/:id/students
 * @desc    Get list of active students in a class (student must be enrolled)
 * @access  Private/Student
 */
const getClassStudents = async (req, res, next) => {
   try {
      const classId = req.params.id;
      const studentId = req.user._id;

      // Security check: Verify the student is enrolled in this class
      const isEnrolled = await ClassMember.exists({
         class: classId,
         user: studentId,
         role: 'student',
         status: 'active'
      });

      if (!isEnrolled) {
         throw ApiError.forbidden('Bạn không thuộc lớp này.');
      }

      const rawMembers = await ClassMember.find({
         class: classId,
         role: 'student',
         status: 'active'
      }).populate('user', 'firstName lastName email phone code avatar');

      const students = rawMembers.map(m => m.user).filter(u => u);
      ApiResponse.ok(res, students);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyClasses,
   getClassById,
   getClassStudents
};
