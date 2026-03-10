const submissionService = require('../../services/submission.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/student/submissions
 * @desc    Get student's submissions
 * @access  Private/Student
 */
const getMySubmissions = async (req, res, next) => {
   try {
      const result = await submissionService.getAllSubmissions({
         ...req.query,
         studentId: req.user._id
      });
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/submissions/:id
 * @desc    Get submission by ID
 * @access  Private/Student
 */
const getSubmissionById = async (req, res, next) => {
   try {
      const submission = await submissionService.getSubmissionById(req.params.id);

      // Set resourceUserId for ownership check
      req.resourceUserId = submission.student._id;

      ApiResponse.ok(res, submission);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/assignments/:assignmentId/submission
 * @desc    Get student's submission for an assignment
 * @access  Private/Student
 */
const getMySubmissionForAssignment = async (req, res, next) => {
   try {
      const submission = await submissionService.getStudentSubmission(
         req.params.assignmentId,
         req.user._id
      );
      ApiResponse.ok(res, submission);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/student/assignments/:assignmentId/submit
 * @desc    Submit assignment
 * @access  Private/Student
 */
const submitAssignment = async (req, res, next) => {
   try {
      const submission = await submissionService.submitAssignment(
         req.params.assignmentId,
         req.user._id,
         req.body
      );
      ApiResponse.created(res, submission, 'Assignment submitted successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/student/assignments/:assignmentId/save-draft
 * @desc    Save draft submission
 * @access  Private/Student
 */
const saveDraft = async (req, res, next) => {
   try {
      const submission = await submissionService.saveDraft(
         req.params.assignmentId,
         req.user._id,
         req.body
      );
      ApiResponse.ok(res, submission, 'Draft saved successfully');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMySubmissions,
   getSubmissionById,
   getMySubmissionForAssignment,
   submitAssignment,
   saveDraft
};
