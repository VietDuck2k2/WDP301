const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const ApiError = require('../utils/apiError');

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
 */
const createAssignment = async (assignmentData, createdBy) => {
   // Verify class exists
   const classData = await Class.findById(assignmentData.class);
   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   const assignment = await Assignment.create({
      ...assignmentData,
      createdBy
   });

   return assignment;
};

/**
 * Update assignment
 */
const updateAssignment = async (assignmentId, updateData) => {
   const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      updateData,
      { new: true, runValidators: true }
   );

   if (!assignment) {
      throw ApiError.notFound('Assignment not found');
   }

   return assignment;
};

/**
 * Delete assignment
 */
const deleteAssignment = async (assignmentId) => {
   const assignment = await Assignment.findByIdAndDelete(assignmentId);

   if (!assignment) {
      throw ApiError.notFound('Assignment not found');
   }

   return assignment;
};

/**
 * Publish assignment
 */
const publishAssignment = async (assignmentId) => {
   const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { status: 'published', publishedAt: new Date() },
      { new: true }
   );

   if (!assignment) {
      throw ApiError.notFound('Assignment not found');
   }

   return assignment;
};

/**
 * Get assignments for a class
 */
const getClassAssignments = async (classId, status = null) => {
   const query = { class: classId };
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

   if (!assignment) {
      throw ApiError.notFound('Assignment not found');
   }

   assignment.attachments.push(attachment);
   await assignment.save();

   return assignment;
};

module.exports = {
   getAllAssignments,
   getAssignmentById,
   createAssignment,
   updateAssignment,
   deleteAssignment,
   publishAssignment,
   getClassAssignments,
   addAttachment
};
