const gradeService = require('../../services/grade.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/student/grades
 * @desc    Get all grades for the logged-in student
 * @access  Private/Student
 */
const getMyGrades = async (req, res, next) => {
   try {
      const data = await gradeService.getStudentGrades(req.user._id);
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/grades/classes/:classId
 * @desc    Get grades for the student in a specific class
 * @access  Private/Student
 */
const getMyGradesByClass = async (req, res, next) => {
   try {
      const data = await gradeService.getStudentGrades(req.user._id, req.params.classId);
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyGrades,
   getMyGradesByClass
};
