const classService = require('../../services/class.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/teacher/classes
 * @desc    Get teacher's classes
 * @access  Private/Teacher
 */
const getMyClasses = async (req, res, next) => {
   try {
      const result = await classService.getAllClasses(req.query, req.user._id, 'teacher');
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/classes/:id
 * @desc    Get class by ID
 * @access  Private/Teacher
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
 * @route   GET /api/teacher/classes/:id/members
 * @desc    Get class members (students)
 * @access  Private/Teacher
 */
const getClassMembers = async (req, res, next) => {
   try {
      const members = await classService.getClassMembers(req.params.id, 'student');
      ApiResponse.ok(res, members);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyClasses,
   getClassById,
   getClassMembers
};
