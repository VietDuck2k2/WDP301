const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const Session = require('../models/Session');
const ApiError = require('../utils/apiError');
const { getSlotByNumber } = require('../constants/slots');

const toDateOnly = (dateValue) => {
   const d = new Date(dateValue);
   d.setHours(0, 0, 0, 0);
   return d;
};

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
   const startDate = toDateOnly(classData.startDate);
   const endDate = toDateOnly(classData.endDate);
   const today = toDateOnly(new Date());

   if (startDate < today) {
      throw ApiError.badRequest('Start date cannot be in the past');
   }

   if (endDate <= startDate) {
      throw ApiError.badRequest('End date must be after start date');
   }

   const newClass = await Class.create(classData);
   return newClass;
};

/**
 * Update class
 */
const updateClass = async (classId, updateData) => {
   const before = await Class.findById(classId);
   if (!before) throw ApiError.notFound('Class not found');

   const startDateChanged = updateData.startDate && new Date(updateData.startDate).getTime() !== new Date(before.startDate).getTime();
   const endDateChanged = updateData.endDate && new Date(updateData.endDate).getTime() !== new Date(before.endDate).getTime();
   const templateChanged = updateData.scheduleTemplate !== undefined && updateData.scheduleTemplate !== (before.scheduleTemplate ? before.scheduleTemplate.toString() : '');

   const needsRegeneration = startDateChanged || endDateChanged || templateChanged;

   // If room is being changed, check conflicts on scheduled/ongoing sessions
   if (updateData.room && updateData.room !== before.room) {
      const newRoom = updateData.room;

      const statusesToCheck = needsRegeneration ? ['ongoing'] : ['scheduled', 'ongoing'];

      if (statusesToCheck.length > 0) {
         const sessionsToCheck = await Session.find({
            class: classId,
            status: { $in: statusesToCheck }
         });

         const conflicts = [];
         for (const s of sessionsToCheck) {
            const dayStart = new Date(s.date); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(s.date); dayEnd.setHours(23, 59, 59, 999);
            const conflict = await Session.findOne({
               _id: { $ne: s._id },
               room: newRoom,
               slotNumber: s.slotNumber,
               date: { $gte: dayStart, $lte: dayEnd }
            }).populate('class', 'name code');
            if (conflict) {
               conflicts.push(
                  `Phòng "${newRoom}" đã được đặt cho lớp ${conflict.class?.name || ''} ` +
                  `vào slot ${s.slotNumber} ngày ${new Date(s.date).toLocaleDateString('vi-VN')}`
               );
            }
         }
         if (conflicts.length > 0) {
            throw ApiError.conflict(
               `Không thể đổi phòng: bị trùng lịch (${conflicts.length} buổi):\n` +
               conflicts.slice(0, 5).join('\n') +
               (conflicts.length > 5 ? `\n... và ${conflicts.length - 5} buổi khác.` : '')
            );
         }

         // No conflicts — cascade room update
         await Session.updateMany(
            { class: classId, status: { $in: statusesToCheck } },
            { room: newRoom }
         );
      }
   }

   const classData = await Class.findByIdAndUpdate(
      classId,
      // Filter out empty scheduleTemplate to avoid BSONObjectId casting error
      updateData.scheduleTemplate === '' ? { ...updateData, scheduleTemplate: null } : updateData,
      { new: true, runValidators: true }
   );

   // Cascade status changes to sessions
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
 * Delete class (soft delete + cascade hard-delete sessions & members)
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

   // Hard-delete all sessions so they disappear from timetables
   await Session.deleteMany({ class: classId });

   // Hard-delete all class member enrollments
   await ClassMember.deleteMany({ class: classId });

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

   // New rule: prevent double-booking a student at the same time in different classes.
   // 1) Find all other active classes of this student.
   const activeMemberships = await ClassMember.find({
      user: studentId,
      role: 'student',
      status: 'active',
      class: { $ne: classId }
   }).select('class');

   if (activeMemberships.length > 0) {
      const otherClassIds = activeMemberships.map((m) => m.class);

      // 2) Fetch all sessions of the target class and those other classes.
      const [targetSessions, otherSessions] = await Promise.all([
         Session.find({ class: classId, status: { $ne: 'cancelled' } }).select('date slotNumber'),
         Session.find({ class: { $in: otherClassIds }, status: { $ne: 'cancelled' } })
            .populate('class', 'name code')
            .select('date slotNumber class')
      ]);

      if (targetSessions.length > 0 && otherSessions.length > 0) {
         // Build a quick lookup: key = yyyy-mm-dd|slot, value = session + class info.
         const conflictMap = new Map();

         otherSessions.forEach((s) => {
            if (!s.date || !s.slotNumber) return;
            const dStr = (s.date instanceof Date
               ? s.date.toISOString().split('T')[0]
               : String(s.date).split('T')[0]);
            const key = `${dStr}|${s.slotNumber}`;
            // Only keep one representative per time slot
            if (!conflictMap.has(key)) {
               conflictMap.set(key, s);
            }
         });

         let firstConflict = null;
         for (const s of targetSessions) {
            if (!s.date || !s.slotNumber) continue;
            const dStr = (s.date instanceof Date
               ? s.date.toISOString().split('T')[0]
               : String(s.date).split('T')[0]);
            const key = `${dStr}|${s.slotNumber}`;
            if (conflictMap.has(key)) {
               firstConflict = { at: s, with: conflictMap.get(key) };
               break;
            }
         }

         if (firstConflict) {
            const slotInfo = getSlotByNumber
               ? getSlotByNumber(firstConflict.at.slotNumber)
               : null;
            const timeLabel = slotInfo
               ? `${slotInfo.startTime} - ${slotInfo.endTime}`
               : `slot ${firstConflict.at.slotNumber}`;

            const otherClass = firstConflict.with.class;
            const dateLabel = (firstConflict.at.date instanceof Date
               ? firstConflict.at.date.toLocaleDateString('vi-VN')
               : String(firstConflict.at.date));

            throw ApiError.conflict(
               `Học sinh đã được xếp học cho lớp ${otherClass?.name || ''} (${otherClass?.code || ''}) ` +
               `vào ${timeLabel} ngày ${dateLabel}. Vui lòng chọn lớp khác hoặc khung giờ khác.`
            );
         }
      }
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
 * Assign one or many teachers to class
 */
const assignTeacher = async (classId, teacherIdsInput) => {
   const classData = await Class.findById(classId);
   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   const rawIds = Array.isArray(teacherIdsInput) ? teacherIdsInput : [teacherIdsInput];
   const teacherIds = [...new Set(rawIds.filter(Boolean).map((id) => String(id)))];
   if (teacherIds.length === 0) {
      throw ApiError.badRequest('Vui lòng chọn ít nhất một giáo viên');
   }

   const objectIdRegex = /^[0-9a-fA-F]{24}$/;
   if (teacherIds.some((id) => !objectIdRegex.test(id))) {
      throw ApiError.badRequest('teacherIds chứa ObjectId không hợp lệ');
   }

   const added = [];
   const reactivated = [];
   const skipped = [];

   for (const teacherId of teacherIds) {
      const existing = await ClassMember.findOne({ class: classId, user: teacherId, role: 'teacher' });
      if (existing && existing.status === 'active') {
         skipped.push(teacherId);
         continue;
      }

      if (existing) {
         existing.status = 'active';
         await existing.save();
         reactivated.push(teacherId);
      } else {
         await ClassMember.create({
            class: classId,
            user: teacherId,
            role: 'teacher'
         });
         added.push(teacherId);
      }
   }

   // Keep old behavior for single-assign flow so existing timetable usage is unchanged.
   if (teacherIds.length === 1) {
      await Session.updateMany(
         { class: classId },
         { teacher: teacherIds[0] }
      );
   }

   return {
      added,
      reactivated,
      skipped,
      summary: {
         total: teacherIds.length,
         success: added.length + reactivated.length,
         skipped: skipped.length
      }
   };
};

/**
 * Get class members
 */
const getClassMembers = async (classId, role = null) => {
   const query = { class: classId, status: 'active' };
   if (role) query.role = role;

   const members = await ClassMember.find(query)
      .populate('user', 'firstName lastName email phone avatar role')
      .sort({ enrolledAt: -1 });

   return members;
};

/**
 * Remove member from class (soft-deactivate)
 */
const removeMember = async (classId, userId) => {
   // Support both inputs:
   // - memberId (ClassMember._id) from UI tables
   // - userId (User._id) from direct API usage
   let member = await ClassMember.findOneAndUpdate(
      { _id: userId, class: classId, status: 'active' },
      { status: 'dropped' },
      { new: true }
   );

   if (!member) {
      member = await ClassMember.findOneAndUpdate(
         { class: classId, user: userId, status: 'active' },
         { status: 'dropped' },
         { new: true }
      );
   }

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
