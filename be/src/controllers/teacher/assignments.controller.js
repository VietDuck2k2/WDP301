const assignmentService = require('../../services/assignment.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/teacher/assignments
 * @desc    Get teacher's assignments
 * @access  Private/Teacher
 */
const getMyAssignments = async (req, res, next) => {
   try {
      const result = await assignmentService.getAllAssignments({
         ...req.query,
         createdBy: req.user._id
      });
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/assignments/:id
 * @desc    Get assignment by ID
 * @access  Private/Teacher
 */
const getAssignmentById = async (req, res, next) => {
   try {
      const assignment = await assignmentService.getAssignmentById(req.params.id);
      ApiResponse.ok(res, assignment);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/assignments
 * @desc    Create new assignment
 * @access  Private/Teacher
 */
const createAssignment = async (req, res, next) => {
   try {
      const assignment = await assignmentService.createAssignment(req.body, req.user._id);
      ApiResponse.created(res, assignment, 'Assignment created successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/teacher/assignments/:id
 * @desc    Update assignment
 * @access  Private/Teacher
 */
const updateAssignment = async (req, res, next) => {
   try {
      const assignment = await assignmentService.updateAssignment(req.params.id, req.body);
      ApiResponse.ok(res, assignment, 'Assignment updated successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/teacher/assignments/:id
 * @desc    Delete assignment
 * @access  Private/Teacher
 */
const deleteAssignment = async (req, res, next) => {
   try {
      const assignment = await assignmentService.deleteAssignment(req.params.id);
      ApiResponse.ok(res, assignment, 'Assignment deleted successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/assignments/:id/publish
 * @desc    Publish assignment
 * @access  Private/Teacher
 */
const publishAssignment = async (req, res, next) => {
   try {
      const assignment = await assignmentService.publishAssignment(req.params.id);
      ApiResponse.ok(res, assignment, 'Assignment published successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/assignments/:id/submissions
 * @desc    Get submissions for an assignment
 * @access  Private/Teacher
 */
const getAssignmentSubmissions = async (req, res, next) => {
   try {
      const submissions = await require('../../services/submission.service').getAssignmentSubmissions(req.params.id);
      ApiResponse.ok(res, submissions);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/submissions/:id/grade
 * @desc    Grade a submission
 * @access  Private/Teacher
 */
const gradeSubmission = async (req, res, next) => {
   try {
      const { score, feedback } = req.body;
      const submission = await require('../../services/submission.service').gradeSubmission(
         req.params.id,
         { score, feedback },
         req.user._id
      );
      ApiResponse.ok(res, submission, 'Submission graded successfully');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyAssignments,
   getAssignmentById,
   createAssignment,
   updateAssignment,
   deleteAssignment,
   publishAssignment,
   getAssignmentSubmissions,
   gradeSubmission
};
