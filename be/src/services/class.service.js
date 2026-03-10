const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const Session = require('../models/Session');
const ApiError = require('../utils/apiError');

/**
 * Get all classes with filters
 */
const getAllClasses = async (filters = {}, userId = null, userRole = null) => {
   const { status, level, search, page = 1, limit = 20 } = filters;

   let query = { isActive: true };

   // Role-based filtering
   if (userRole === 'teacher') {
      const teacherClasses = await ClassMember.find({ user: userId, role: 'teacher', status: 'active' })
         .select('class');
      query._id = { $in: teacherClasses.map(cm => cm.class) };
   } else if (userRole === 'student') {
      const studentClasses = await ClassMember.find({ user: userId, role: 'student', status: 'active' })
         .select('class');
      query._id = { $in: studentClasses.map(cm => cm.class) };
      // Students should only see active/draft classes, not cancelled/completed
      query.status = { $in: ['active', 'draft'] };
   }

   if (status) query.status = status;
   if (level) query.level = level;
   if (search) {
      query.$or = [
         { name: new RegExp(search, 'i') },
         { code: new RegExp(search, 'i') }
      ];
   }

   const skip = (page - 1) * limit;

   const [classes, total] = await Promise.all([
      Class.find(query)
         .populate('scheduleTemplate')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit)),
      Class.countDocuments(query)
   ]);

   return {
      classes,
      pagination: {
         page: parseInt(page),
         limit: parseInt(limit),
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

/**
 * Get class by ID
 */
const getClassById = async (classId) => {
   const classData = await Class.findById(classId)
      .populate('scheduleTemplate');

   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   // Get enrolled members count
   const studentsCount = await ClassMember.countDocuments({
      class: classId,
      role: 'student',
      status: 'active'
   });

   const teachers = await ClassMember.find({
      class: classId,
      role: 'teacher',
      status: 'active'
   }).populate('user', 'firstName lastName email');

   return {
      ...classData.toObject(),
      studentsCount,
      teachers: teachers.map(t => t.user)
   };
};

/**
 * Create new class
 */
const createClass = async (classData) => {
   // Check if code already exists
   const existingClass = await Class.findOne({ code: classData.code });
   if (existingClass) {
      throw ApiError.conflict('Class code already exists');
   }

   // Validate dates
   if (new Date(classData.endDate) <= new Date(classData.startDate)) {
      throw ApiError.badRequest('End date must be after start date');
   }

   const newClass = await Class.create(classData);
   return newClass;
};

/**
 * Update class
 */
const updateClass = async (classId, updateData) => {
   const classData = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
   );

   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   // Cascade to sessions if status changed
   if (updateData.status && classData.status === updateData.status) {
      if (updateData.status === 'cancelled') {
         await Session.updateMany(
            { class: classId, status: { $in: ['scheduled', 'ongoing'] } },
            { status: 'cancelled' }
         );
      } else if (updateData.status === 'completed') {
         await Session.updateMany(
            { class: classId, status: { $in: ['scheduled', 'ongoing'] } },
            { status: 'completed' }
         );
      }
   }

   return classData;
};

/**
 * Delete class (soft delete)
 */
const deleteClass = async (classId) => {
   const classData = await Class.findByIdAndUpdate(
      classId,
      { isActive: false },
      { new: true }
   );

   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   // Cascade to sessions
   await Session.updateMany(
      { class: classId, status: { $in: ['scheduled', 'ongoing'] } },
      { status: 'cancelled' }
   );

   return classData;
};

/**
 * Enroll student in class
 */
const enrollStudent = async (classId, studentId) => {
   const classData = await Class.findById(classId);
   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   // Check capacity
   const currentCount = await ClassMember.countDocuments({
      class: classId,
      role: 'student',
      status: 'active'
   });

   if (currentCount >= classData.capacity) {
      throw ApiError.badRequest('Class is full');
   }

   // Check if already enrolled
   const existing = await ClassMember.findOne({ class: classId, user: studentId });
   if (existing && existing.status === 'active') {
      throw ApiError.conflict('Student already enrolled in this class');
   }

   // Create or update enrollment
   if (existing) {
      existing.status = 'active';
      existing.enrolledAt = new Date();
      await existing.save();
      return existing;
   } else {
      const enrollment = await ClassMember.create({
         class: classId,
         user: studentId,
         role: 'student'
      });
      return enrollment;
   }
};

/**
 * Assign teacher to class
 */
const assignTeacher = async (classId, teacherId) => {
   const classData = await Class.findById(classId);
   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   // Check if already assigned
   const existing = await ClassMember.findOne({ class: classId, user: teacherId, role: 'teacher' });
   if (existing && existing.status === 'active') {
      throw ApiError.conflict('Teacher already assigned to this class');
   }

   // Create or update assignment
   if (existing) {
      existing.status = 'active';
      await existing.save();
      return existing;
   } else {
      const assignment = await ClassMember.create({
         class: classId,
         user: teacherId,
         role: 'teacher'
      });
      return assignment;
   }
};

/**
 * Get class members
 */
const getClassMembers = async (classId, role = null) => {
   const query = { class: classId, status: 'active' };
   if (role) query.role = role;

   const members = await ClassMember.find(query)
      .populate('user', 'firstName lastName email avatar role')
      .sort({ enrolledAt: -1 });

   return members;
};

/**
 * Remove member from class (soft-deactivate)
 */
const removeMember = async (classId, userId) => {
   const member = await ClassMember.findOneAndUpdate(
      { class: classId, user: userId, status: 'active' },
      { status: 'inactive' },
      { new: true }
   );

   if (!member) {
      throw ApiError.notFound('Class member not found');
   }

   return member;
};

module.exports = {
   getAllClasses,
   getClassById,
   createClass,
   updateClass,
   deleteClass,
   enrollStudent,
   assignTeacher,
   getClassMembers,
   removeMember
};
