const assignmentService = require('../../services/assignment.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/student/classes/:classId/assignments
 * @desc    Get assignments for a class
 * @access  Private/Student
 */
const getClassAssignments = async (req, res, next) => {
   try {
      const assignments = await assignmentService.getClassAssignments(req.params.classId, 'published');
      ApiResponse.ok(res, assignments);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private/Student
 */
const getAssignmentById = async (req, res, next) => {
   try {
      const assignment = await assignmentService.getAssignmentById(req.params.id);
      ApiResponse.ok(res, assignment);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getClassAssignments,
   getAssignmentById
};
