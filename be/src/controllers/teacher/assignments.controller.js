const assignmentService = require('../../services/assignment.service');
const submissionService = require('../../services/submission.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/teacher/assignments
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
 */
const updateAssignment = async (req, res, next) => {
   try {
      const assignment = await assignmentService.updateAssignment(req.params.id, req.body, req.user._id);
      ApiResponse.ok(res, assignment, 'Assignment updated successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/teacher/assignments/:id
 */
const deleteAssignment = async (req, res, next) => {
   try {
      const result = await assignmentService.deleteAssignment(req.params.id, req.user._id);
      ApiResponse.ok(res, result, result.deleted ? 'Assignment deleted' : 'Assignment archived');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/assignments/:id/publish
 */
const publishAssignment = async (req, res, next) => {
   try {
      const assignment = await assignmentService.publishAssignment(req.params.id, req.user._id);
      ApiResponse.ok(res, assignment, 'Assignment published successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/assignments/:id/close
 */
const closeAssignment = async (req, res, next) => {
   try {
      const assignment = await assignmentService.closeAssignment(req.params.id, req.user._id);
      ApiResponse.ok(res, assignment, 'Assignment closed successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/assignments/:id/submissions
 */
const getAssignmentSubmissions = async (req, res, next) => {
   try {
      const submissions = await submissionService.getAssignmentSubmissions(req.params.id, req.user._id);
      ApiResponse.ok(res, submissions);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/submissions/:id/grade
 */
const gradeSubmission = async (req, res, next) => {
   try {
      const { score, feedback } = req.body;
      const submission = await submissionService.gradeSubmission(
         req.params.id,
         { score, feedback },
         req.user._id
      );
      ApiResponse.ok(res, submission, 'Submission graded successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/submissions/:id/return
 */
const returnSubmission = async (req, res, next) => {
   try {
      const { returnReason } = req.body;
      const submission = await submissionService.returnForRevision(
         req.params.id,
         { returnReason },
         req.user._id
      );
      ApiResponse.ok(res, submission, 'Submission returned for revision');
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
   closeAssignment,
   getAssignmentSubmissions,
   gradeSubmission,
   returnSubmission
};
