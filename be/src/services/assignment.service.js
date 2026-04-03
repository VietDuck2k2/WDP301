const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const ApiError = require('../utils/apiError');

// MAX resubmission attempts
const MAX_ATTEMPTS = 3;

/**
 * Verify teacher is assigned to the class of the assignment.
 * Throws 403 if not authorized.
 */
const assertTeacherOwnsClass = async (classId, teacherId) => {
   const member = await ClassMember.findOne({
      class: classId,
      user: teacherId,
      role: 'teacher',
      status: 'active'
   });
   if (!member) throw ApiError.forbidden('You are not assigned to this class');
};

/**
 * Get all assignments with filters
 */
const getAllAssignments = async (filters = {}) => {
   const { classId, status, createdBy, page = 1, limit = 20 } = filters;

   const query = {};

   if (classId) query.class = classId;
   if (status) query.status = status;
   if (createdBy) query.createdBy = createdBy;

   const skip = (page - 1) * limit;

   const [assignments, total] = await Promise.all([
      Assignment.find(query)
         .populate('class', 'name code')
         .populate('createdBy', 'firstName lastName')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit)),
      Assignment.countDocuments(query)
   ]);

   return {
      assignments,
      pagination: {
         page: parseInt(page),
         limit: parseInt(limit),
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

/**
 * Get assignment by ID
 */
const getAssignmentById = async (assignmentId) => {
   const assignment = await Assignment.findById(assignmentId)
      .populate('class', 'name code')
      .populate('createdBy', 'firstName lastName email')
      .populate('submissionsCount');

   if (!assignment) {
      throw ApiError.notFound('Assignment not found');
   }

   return assignment;
};

/**
 * Create new assignment
 * Teacher must be assigned to the class.
 * closeDate must be >= dueDate.
 */
const createAssignment = async (assignmentData, createdBy) => {
   const classData = await Class.findById(assignmentData.class);
   if (!classData) throw ApiError.notFound('Class not found');

   await assertTeacherOwnsClass(assignmentData.class, createdBy);

   // Validate date logic — auto-default closeDate to dueDate + 1 day if not provided
   const dueDate = new Date(assignmentData.dueDate);
   let closeDate;
   if (assignmentData.closeDate) {
      closeDate = new Date(assignmentData.closeDate);
      if (closeDate < dueDate) {
         throw ApiError.badRequest('closeDate must be on or after dueDate');
      }
   } else {
      // Default: closeDate = dueDate + 1 day
      closeDate = new Date(dueDate);
      closeDate.setDate(closeDate.getDate() + 1);
   }

   const assignment = await Assignment.create({ ...assignmentData, closeDate, createdBy });
   return assignment;
};

/**
 * Update assignment with field-gating rules.
 * After submission exists: only allow safe fields.
 * Closed assignment: no edits at all.
 */
const updateAssignment = async (assignmentId, updateData, teacherId) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   await assertTeacherOwnsClass(assignment.class, teacherId);

   if (assignment.status === 'closed' || assignment.status === 'archived') {
      throw ApiError.badRequest('Cannot edit a closed or archived assignment');
   }

   // Check if any submissions exist
   const submissionCount = await Submission.countDocuments({ assignment: assignmentId });

   const LOCKED_AFTER_SUBMISSION = ['class', 'maxScore', 'assignmentType'];
   const LOCKED_AFTER_PUBLISH = ['class', 'assignmentType'];

   if (submissionCount > 0) {
      for (const field of LOCKED_AFTER_SUBMISSION) {
         if (updateData[field] !== undefined) {
            throw ApiError.badRequest(`Cannot update "${field}" after students have submitted`);
         }
      }
   } else if (assignment.status === 'published') {
      for (const field of LOCKED_AFTER_PUBLISH) {
         if (updateData[field] !== undefined) {
            throw ApiError.badRequest(`Cannot update "${field}" after assignment is published`);
         }
      }
   }

   // Validate closeDate vs dueDate if either is being changed
   const newDueDate = updateData.dueDate ? new Date(updateData.dueDate) : assignment.dueDate;
   const newCloseDate = updateData.closeDate ? new Date(updateData.closeDate) : assignment.closeDate;
   if (newCloseDate < newDueDate) {
      throw ApiError.badRequest('closeDate must be on or after dueDate');
   }

   const updated = await Assignment.findByIdAndUpdate(
      assignmentId,
      updateData,
      { new: true, runValidators: true }
   );
   return updated;
};

/**
 * Delete assignment with archive guard.
 * draft + no submissions → hard-delete
 * published OR has submissions → soft-archive
 */
const deleteAssignment = async (assignmentId, teacherId) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   await assertTeacherOwnsClass(assignment.class, teacherId);

   const submissionCount = await Submission.countDocuments({ assignment: assignmentId });

   if (assignment.status === 'draft' && submissionCount === 0) {
      await assignment.deleteOne();
      return { deleted: true };
   }

   // Soft-archive
   assignment.status = 'archived';
   await assignment.save();
   return { archived: true, assignment };
};

/**
 * Publish assignment
 */
const publishAssignment = async (assignmentId, teacherId) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   await assertTeacherOwnsClass(assignment.class, teacherId);

   if (assignment.status !== 'draft') {
      throw ApiError.badRequest('Only draft assignments can be published');
   }

   assignment.status = 'published';
   assignment.publishedAt = new Date();
   await assignment.save();
   return assignment;
};

/**
 * Close assignment manually.
 * Sets status=closed, closedAt=now.
 */
const closeAssignment = async (assignmentId, teacherId) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   await assertTeacherOwnsClass(assignment.class, teacherId);

   if (assignment.status !== 'published') {
      throw ApiError.badRequest('Only published assignments can be closed');
   }

   assignment.status = 'closed';
   assignment.closedAt = new Date();
   await assignment.save();
   return assignment;
};

/**
 * Get assignments for a class (used by student routes after enrollment check)
 */
const getClassAssignments = async (classId, status = null) => {
   const query = { class: classId, status: { $in: ['published', 'closed'] } };
   if (status) query.status = status;

   const assignments = await Assignment.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ dueDate: 1 });

   return assignments;
};

/**
 * Add attachment to assignment
 */
const addAttachment = async (assignmentId, attachment) => {
   const assignment = await Assignment.findById(assignmentId);
   if (!assignment) throw ApiError.notFound('Assignment not found');

   assignment.attachments.push(attachment);
   await assignment.save();
   return assignment;
};

module.exports = {
   MAX_ATTEMPTS,
   assertTeacherOwnsClass,
   getAllAssignments,
   getAssignmentById,
   createAssignment,
   updateAssignment,
   deleteAssignment,
   publishAssignment,
   closeAssignment,
   getClassAssignments,
   addAttachment
};
