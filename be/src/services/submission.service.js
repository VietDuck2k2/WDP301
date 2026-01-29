const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const ClassMember = require('../models/ClassMember');
const ApiError = require('../utils/apiError');

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
      .populate('assignment', 'title dueDate maxScore')
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
    .populate('assignment', 'title description dueDate maxScore')
    .populate('student', 'firstName lastName email')
    .populate('gradedBy', 'firstName lastName');
  
  if (!submission) {
    throw ApiError.notFound('Submission not found');
  }

  return submission;
};

/**
 * Create or update submission
 */
const submitAssignment = async (assignmentId, studentId, submissionData) => {
  const assignment = await Assignment.findById(assignmentId);
  
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  if (assignment.status !== 'published') {
    throw ApiError.badRequest('Assignment is not published');
  }

  // Verify student is enrolled in the class
  const enrollment = await ClassMember.findOne({ 
    class: assignment.class, 
    user: studentId, 
    role: 'student',
    status: 'active'
  });

  if (!enrollment) {
    throw ApiError.badRequest('Student not enrolled in this class');
  }

  // Check if submission is late
  const isLate = new Date() > new Date(assignment.dueDate);

  // Create or update submission
  const submission = await Submission.findOneAndUpdate(
    { assignment: assignmentId, student: studentId },
    {
      ...submissionData,
      status: 'submitted',
      submittedAt: new Date(),
      isLate
    },
    { upsert: true, new: true, runValidators: true }
  );

  return submission;
};

/**
 * Save draft submission
 */
const saveDraft = async (assignmentId, studentId, submissionData) => {
  const assignment = await Assignment.findById(assignmentId);
  
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignmentId, student: studentId },
    {
      ...submissionData,
      status: 'draft'
    },
    { upsert: true, new: true, runValidators: true }
  );

  return submission;
};

/**
 * Grade submission
 */
const gradeSubmission = async (submissionId, gradeData, gradedBy) => {
  const submission = await Submission.findById(submissionId).populate('assignment');
  
  if (!submission) {
    throw ApiError.notFound('Submission not found');
  }

  if (submission.status !== 'submitted') {
    throw ApiError.badRequest('Submission has not been submitted yet');
  }

  // Validate score
  if (gradeData.score > submission.assignment.maxScore) {
    throw ApiError.badRequest(`Score cannot exceed maximum score of ${submission.assignment.maxScore}`);
  }

  submission.score = gradeData.score;
  submission.feedback = gradeData.feedback;
  submission.status = 'graded';
  submission.gradedBy = gradedBy;
  submission.gradedAt = new Date();

  await submission.save();

  return submission;
};

/**
 * Get submissions for an assignment
 */
const getAssignmentSubmissions = async (assignmentId) => {
  const submissions = await Submission.find({ assignment: assignmentId })
    .populate('student', 'firstName lastName email')
    .sort({ submittedAt: -1 });

  return submissions;
};

/**
 * Get student's submission for an assignment
 */
const getStudentSubmission = async (assignmentId, studentId) => {
  const submission = await Submission.findOne({ 
    assignment: assignmentId, 
    student: studentId 
  }).populate('assignment', 'title description dueDate maxScore');

  return submission;
};

/**
 * Add attachment to submission
 */
const addAttachment = async (submissionId, attachment) => {
  const submission = await Submission.findById(submissionId);
  
  if (!submission) {
    throw ApiError.notFound('Submission not found');
  }

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
  getAssignmentSubmissions,
  getStudentSubmission,
  addAttachment
};
