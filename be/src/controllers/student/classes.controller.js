const classService = require('../../services/class.service');
const ApiResponse = require('../../utils/apiResponse');

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

module.exports = {
  getMyClasses,
  getClassById
};
