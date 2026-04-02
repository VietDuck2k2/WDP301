const assignmentService = require('../../services/assignment.service');
const submissionService = require('../../services/submission.service');
const ClassMember = require('../../models/ClassMember');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

/**
 * Assert student is enrolled in the given class.
 */
const assertEnrolled = async (classId, studentId) => {
   const member = await ClassMember.findOne({
      class: classId,
      user: studentId,
      role: 'student',
      status: 'active'
   });
   if (!member) throw ApiError.forbidden('You are not enrolled in this class');
};

/**
 * @route   GET /api/student/classes/:classId/assignments
 * Shows published + closed assignments. Adds `missing` computed status.
 */
const getClassAssignments = async (req, res, next) => {
   try {
      await assertEnrolled(req.params.classId, req.user._id);

      const assignments = await assignmentService.getClassAssignments(req.params.classId);

      const now = new Date();

      // Attach student's own submission status + compute `missing`
      const result = await Promise.all(assignments.map(async (a) => {
         const submission = await submissionService.getStudentSubmission(a._id, req.user._id);
         const subStatus = submission ? submission.status : 'none';
         const missing = now > new Date(a.dueDate) && ['none', 'draft'].includes(subStatus);
         return {
            ...a.toObject(),
            submissionStatus: missing ? 'missing' : subStatus,
            submission: submission ? {
               _id: submission._id,
               status: submission.status,
               isLate: submission.isLate,
               isResubmission: submission.isResubmission,
               attemptNo: submission.attemptNo,
               submittedAt: submission.submittedAt,
               score: submission.score,
               feedback: submission.feedback,
               returnReason: submission.returnReason
            } : null
         };
      }));

      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/assignments/:id
 */
const getAssignmentById = async (req, res, next) => {
   try {
      const assignment = await assignmentService.getAssignmentById(req.params.id);
      // Verify student is enrolled in the class
      await assertEnrolled(assignment.class._id || assignment.class, req.user._id);
      ApiResponse.ok(res, assignment);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getClassAssignments,
   getAssignmentById
};
