const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const ClassMember = require('../models/ClassMember');
const ApiError = require('../utils/apiError');
const { MAX_ATTEMPTS, assertTeacherOwnsClass } = require('./assignment.service');

/**
 * Assert student is actively enrolled in the class of the assignment.
 */
const assertStudentEnrolled = async (classId, studentId) => {
   const enrollment = await ClassMember.findOne({
      class: classId,
      user: studentId,
      role: 'student',
      status: 'active'
   });
   if (!enrollment) throw ApiError.forbidden('You are not enrolled in this class');
};

/**
 * Get all submissions with filters
 */
const getAllSubmissions = async (filters = {}) => {
   const { assignmentId, studentId, status, page = 1, limit = 20 } = filters;

   const query = {};

   if (assignmentId) query.assignment = assignmentId;
   if (studentId) query.student = studentId;
   if (status) query.status = status;

   const skip = (page - 1) * limit;

   const [submissions, total] = await Promise.all([
      Submission.find(query)
         .populate('assignment', 'title dueDate closeDate maxScore')
         .populate('student', 'firstName lastName email')
         .populate('gradedBy', 'firstName lastName')
         .sort({ submittedAt: -1 })
         .skip(skip)
         .limit(parseInt(limit)),
      Submission.countDocuments(query)
   ]);

   return {
      submissions,
      pagination: {
         page: parseInt(page),
         limit: parseInt(limit),
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

/**
 * Get submission by ID
 */
const getSubmissionById = async (submissionId) => {
   const submission = await Submission.findById(submissionId)
      .populate('assignment', 'title description dueDate closeDate maxScore')
      .populate('student', 'firstName lastName email')
      .populate('gradedBy', 'firstName lastName');

   if (!submission) throw ApiError.notFound('Submission not found');
   return submission;
};

/**
 * Submit assignment (official submission or resubmission if returned).
 *
 * Guards (in order):
 * 1. Student enrolled in class
 * 2. Assignment status (draft/archived → 400)
 * 3. now > closeDate → 400 (runtime gate, independent of assignment.status)
 * 4. Assignment closed → 400
 * 5. now > dueDate AND allowLateSubmission=false → 400
 * 6. Existing submission status=submitted → 400
 * 7. Existing submission status=graded → 400
 * 8. Existing submission status=returned → allow resubmit (attemptNo++)
 */
const submitAssignment = async (assignmentId, studentId, submissionData) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   // Guard 1: enrollment
   await assertStudentEnrolled(assignment.class, studentId);

   // Guard 2: assignment status
   if (assignment.status === 'draft' || assignment.status === 'archived') {
      throw ApiError.badRequest('Assignment is not available for submission');
   }

   const now = new Date();

   // Guard 3: closeDate (runtime gate — always checked regardless of status)
   if (assignment.closeDate && now > new Date(assignment.closeDate)) {
      throw ApiError.badRequest('Assignment has passed its close date and is no longer accepting submissions');
   }

   // Guard 4: status=closed (manual close)
   if (assignment.status === 'closed') {
      throw ApiError.badRequest('Assignment is closed');
   }

   // Guard 5: late submission policy
   const isLate = now > new Date(assignment.dueDate);
   if (isLate && !assignment.allowLateSubmission) {
      throw ApiError.badRequest('The due date has passed. Late submissions are not allowed for this assignment');
   }

   // Check existing submission
   const existing = await Submission.findOne({ assignment: assignmentId, student: studentId });

   if (existing) {
      if (existing.status === 'submitted') {
         throw ApiError.badRequest('You have already submitted this assignment. Wait for teacher review');
      }
      if (existing.status === 'graded') {
         throw ApiError.badRequest('Your submission has been graded. You can no longer modify it');
      }
      if (existing.status === 'returned') {
         // Resubmission — check attempt limit
         if (existing.attemptNo >= MAX_ATTEMPTS) {
            throw ApiError.badRequest(`You have reached the maximum number of submissions (${MAX_ATTEMPTS})`);
         }

         existing.content = submissionData.content ?? existing.content;
         existing.attachments = submissionData.attachments ?? existing.attachments;
         existing.status = 'submitted';
         existing.submittedAt = now;
         existing.isLate = isLate;
         existing.isResubmission = true;
         existing.attemptNo = existing.attemptNo + 1;
         existing.returnedAt = undefined;
         existing.returnReason = undefined;
         await existing.save();
         return existing;
      }
   }

   // New submission or updating a draft
   const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      {
         ...submissionData,
         status: 'submitted',
         submittedAt: now,
         isLate,
         isResubmission: false,
         attemptNo: existing ? existing.attemptNo : 1
      },
      { upsert: true, new: true, runValidators: true }
   );

   return submission;
};

/**
 * Save draft submission (no guard on closeDate/dueDate — just save locally).
 * Student must be enrolled.
 * Cannot save draft if graded.
 */
const saveDraft = async (assignmentId, studentId, submissionData) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   await assertStudentEnrolled(assignment.class, studentId);

   if (assignment.status === 'draft' || assignment.status === 'archived') {
      throw ApiError.badRequest('Assignment is not available');
   }

   const existing = await Submission.findOne({ assignment: assignmentId, student: studentId });
   if (existing && existing.status === 'graded') {
      throw ApiError.badRequest('Cannot save draft — submission is already graded');
   }

   const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      { ...submissionData, status: 'draft' },
      { upsert: true, new: true, runValidators: true }
   );

   return submission;
};

/**
 * Grade submission.
 * Teacher must teach the class.
 * Allowed on: submitted, returned, graded (re-grade).
 * Not allowed on: draft.
 */
const gradeSubmission = async (submissionId, gradeData, teacherId) => {
   const submission = await Submission.findById(submissionId).populate('assignment');
   if (!submission) throw ApiError.notFound('Submission not found');

   await assertTeacherOwnsClass(submission.assignment.class, teacherId);

   if (submission.status === 'draft') {
      throw ApiError.badRequest('Cannot grade a draft submission. Student must submit first');
   }

   if (gradeData.score > submission.assignment.maxScore) {
      throw ApiError.badRequest(`Score cannot exceed maximum score of ${submission.assignment.maxScore}`);
   }

   submission.score = gradeData.score;
   submission.feedback = gradeData.feedback ?? submission.feedback;
   submission.status = 'graded';
   submission.gradedBy = teacherId;
   submission.gradedAt = new Date();

   await submission.save();
   return submission;
};

/**
 * Return submission for revision.
 * Teacher must teach the class.
 * Clears score/feedback from active record.
 * Increments attemptNo check — blocks if already at max.
 */
const returnForRevision = async (submissionId, { returnReason }, teacherId) => {
   if (!returnReason || !returnReason.trim()) {
      throw ApiError.badRequest('returnReason is required when returning a submission');
   }

   const submission = await Submission.findById(submissionId).populate('assignment');
   if (!submission) throw ApiError.notFound('Submission not found');

   await assertTeacherOwnsClass(submission.assignment.class, teacherId);

   if (!['submitted', 'graded'].includes(submission.status)) {
      throw ApiError.badRequest('Can only return submissions that are submitted or graded');
   }

   if (submission.attemptNo >= MAX_ATTEMPTS) {
      throw ApiError.badRequest(`Student has reached the maximum number of attempts (${MAX_ATTEMPTS}). Cannot return for revision`);
   }

   // Clear active score/feedback when returning from graded
   submission.score = null;
   submission.feedback = null;
   submission.gradedAt = null;
   submission.gradedBy = null;

   submission.status = 'returned';
   submission.returnedAt = new Date();
   submission.returnReason = returnReason.trim();

   await submission.save();
   return submission;
};

/**
 * Get all submissions for an assignment (teacher view).
 * Teacher must teach the class.
 */
const getAssignmentSubmissions = async (assignmentId, teacherId) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   await assertTeacherOwnsClass(assignment.class, teacherId);

   const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName email')
      .sort({ submittedAt: -1 });

   return submissions;
};

/**
 * Get student's submission for a specific assignment.
 */
const getStudentSubmission = async (assignmentId, studentId) => {
   const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
   }).populate('assignment', 'title description dueDate closeDate maxScore allowLateSubmission');

   return submission;
};

/**
 * Add attachment to submission
 */
const addAttachment = async (submissionId, attachment) => {
   const submission = await Submission.findById(submissionId);
   if (!submission) throw ApiError.notFound('Submission not found');

   submission.attachments.push(attachment);
   await submission.save();
   return submission;
};

module.exports = {
   getAllSubmissions,
   getSubmissionById,
   submitAssignment,
   saveDraft,
   gradeSubmission,
   returnForRevision,
   getAssignmentSubmissions,
   getStudentSubmission,
   addAttachment
};
