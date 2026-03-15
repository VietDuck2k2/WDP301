const Session = require('../models/Session');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const ScheduleTemplate = require('../models/ScheduleTemplate');
const ApiError = require('../utils/apiError');
const { getSlotByNumber } = require('../constants/slots');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Check if a room is already booked at the same date + slotNumber.
 * @param {string} room - Room name
 * @param {Date|string} date - Session date
 * @param {number} slotNumber - Slot number
 * @param {string} [excludeSessionId] - Session ID to exclude (for updates)
 */
const checkRoomConflict = async (room, date, slotNumber, excludeSessionId = null) => {
   if (!room) return; // no room assigned → no conflict possible

   const parseLocalZeroHour = (dateInput) => {
      const dStr = dateInput instanceof Date ? dateInput.toISOString().split('T')[0] : String(dateInput).split('T')[0];
      const [year, month, day] = dStr.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
   };

   const dayStart = parseLocalZeroHour(date);
   const dayEnd = new Date(dayStart);
   dayEnd.setHours(23, 59, 59, 999);

   const conflictQuery = {
      room,
      slotNumber,
      date: { $gte: dayStart, $lte: dayEnd }
   };
   if (excludeSessionId) conflictQuery._id = { $ne: excludeSessionId };

   const conflict = await Session.findOne(conflictQuery).populate('class', 'name code');
   if (conflict) {
      throw ApiError.conflict(
         `Phòng "${room}" đã được đặt cho lớp ${conflict.class?.name || ''} (${conflict.class?.code || ''}) ` +
         `vào slot ${slotNumber} ngày ${new Date(date).toLocaleDateString('vi-VN')}.`
      );
   }
};


/**
 * Get all sessions with filters
 */
const getAllSessions = async (filters = {}) => {
   const { classId, teacherId, status, startDate, endDate, page = 1, limit = 20 } = filters;

   const query = {};

   if (classId) query.class = classId;
   if (teacherId) query.teacher = teacherId;
   if (status) query.status = status;
   if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
   }

   const skip = (page - 1) * limit;

   const [sessions, total] = await Promise.all([
      Session.find(query)
         .populate('class', 'name code')
         .populate('teacher', 'firstName lastName email')
         .sort({ date: 1, startTime: 1 })
         .skip(skip)
         .limit(parseInt(limit)),
      Session.countDocuments(query)
   ]);

   return {
      sessions,
      pagination: {
         page: parseInt(page),
         limit: parseInt(limit),
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

/**
 * Get session by ID
 */
const getSessionById = async (sessionId) => {
   const session = await Session.findById(sessionId)
      .populate('class', 'name code')
      .populate('teacher', 'firstName lastName email');

   if (!session) {
      throw ApiError.notFound('Session not found');
   }

   return session;
};

/**
 * Create new session
 */
const createSession = async (sessionData) => {
   // Verify class exists
   const classData = await Class.findById(sessionData.class);
   if (!classData) {
      throw ApiError.notFound('Class not found');
   }

   // Auto-fill startTime/endTime from slotNumber
   let data = { ...sessionData };
   if (data.slotNumber) {
      const slotDef = getSlotByNumber(Number(data.slotNumber));
      if (!slotDef) throw ApiError.badRequest(`Slot ${data.slotNumber} không hợp lệ (phải từ 1-5)`);
      data.startTime = slotDef.startTime;
      data.endTime = slotDef.endTime;
   }

   if (!data.startTime || !data.endTime) {
      throw ApiError.badRequest('startTime hoặc endTime là bắt buộc khi không chọn slot');
   }

   // Check for duplicate session number in class
   const existingSession = await Session.findOne({
      class: data.class,
      sessionNumber: data.sessionNumber
   });
   if (existingSession) {
      throw ApiError.conflict('Session number already exists for this class');
   }

   // Check room conflict
   await checkRoomConflict(data.room, data.date, data.slotNumber);

   const session = await Session.create(data);
   return session;
};

/**
 * Update session
 */
const updateSession = async (sessionId, updateData) => {
   // If room or slot is being changed, check for conflicts
   const existing = await Session.findById(sessionId);
   if (!existing) throw ApiError.notFound('Session not found');

   // If session is being cancelled, ensure cancelReason is provided (or at least handled gracefully)
   if (updateData.status === 'cancelled' && existing.status !== 'cancelled') {
      // Allow it to pass, but the controller should ideally enforce cancelReason
   }

   const room = updateData.room !== undefined ? updateData.room : existing.room;
   const slotNumber = updateData.slotNumber !== undefined ? updateData.slotNumber : existing.slotNumber;
   const date = updateData.date !== undefined ? updateData.date : existing.date;

   // Only check conflicts if the session is NOT being cancelled
   if (updateData.status !== 'cancelled') {
      await checkRoomConflict(room, date, slotNumber, sessionId);
   }

   const session = await Session.findByIdAndUpdate(
      sessionId,
      updateData,
      { new: true, runValidators: true }
   );

   return session;
};

/**
 * Create a Make-up Session based on a cancelled session
 */
const createMakeupSession = async (originalSessionId, makeupData) => {
   const originalSession = await Session.findById(originalSessionId);
   if (!originalSession) throw ApiError.notFound('Original session not found');

   if (originalSession.status !== 'cancelled') {
      throw ApiError.badRequest('Buổi học gốc phải ở trạng thái Đã Huỷ mới có thể tạo phụ đạo/học bù.');
   }

   // Auto-fill startTime/endTime from slotNumber if provided
   let data = {
      class: originalSession.class,
      title: `${originalSession.title} (Học bù)`,
      sessionNumber: originalSession.sessionNumber, // Keep same semantic session number
      date: makeupData.date,
      slotNumber: makeupData.slotNumber,
      room: makeupData.room,
      teacher: makeupData.teacherId || originalSession.teacher,
      status: 'scheduled',
      isMakeup: true,
      makeupForSession: originalSession._id
   };

   if (data.slotNumber) {
      const slotDef = getSlotByNumber(Number(data.slotNumber));
      if (!slotDef) throw ApiError.badRequest(`Slot ${data.slotNumber} không hợp lệ`);
      data.startTime = slotDef.startTime;
      data.endTime = slotDef.endTime;
   } else {
      throw ApiError.badRequest('Vui lòng chọn khung giờ học (slot) cho buổi học bù');
   }

   // Temporarily modify the unique sessionNumber index check logic by giving makeup sessions a decimal trick or similar
   // Wait, Session Schema has: sessionSchema.index({ class: 1, sessionNumber: 1 }, { unique: true });
   // We cannot reuse sessionNumber directly if the original session is NOT deleted.
   // Instead, let's append a decimal or find the max session number to append to the class timeline
   const lastSession = await Session.findOne({ class: data.class }).sort({ sessionNumber: -1 });
   data.sessionNumber = lastSession ? lastSession.sessionNumber + 1 : 1;

   // Keep the title semantic to the original
   data.title = `Bù cho ${originalSession.title}`;

   // Check room conflict
   await checkRoomConflict(data.room, data.date, data.slotNumber);

   const session = await Session.create(data);

   // Check if the new makeup session date extends past the class end date, update class if so
   const mClass = await Class.findById(data.class);
   const makeupDate = new Date(data.date);

   // Optional logic: we could automatically update the class endDate if makeupDate > class.endDate
   // For now, let's leave it as is, or we can update it if it exceeds.
   if (mClass && makeupDate > mClass.endDate) {
      mClass.endDate = makeupDate;
      await mClass.save();
   }

   return session;
};

/**
 * Delete session
 */
const deleteSession = async (sessionId) => {
   const session = await Session.findByIdAndDelete(sessionId);

   if (!session) {
      throw ApiError.notFound('Session not found');
   }

   return session;
};

/**
 * Get sessions for a class
 */
const getClassSessions = async (classId) => {
   const sessions = await Session.find({ class: classId })
      .populate('teacher', 'firstName lastName')
      .sort({ date: 1, startTime: 1 });

   return sessions;
};

/**
 * Add material to session
 */
const addMaterial = async (sessionId, material) => {
   const session = await Session.findById(sessionId);

   if (!session) {
      throw ApiError.notFound('Session not found');
   }

   session.materials.push(material);
   await session.save();

   return session;
};

/**
 * Get weekly timetable grouped by day
 * @param {Object} filters - { weekStart, classId, teacherId, studentId }
 */
const getWeeklyTimetable = async (filters = {}) => {
   // Run lazy update
   await autoUpdateStatuses();

   const { weekStart, classId, teacherId, studentId } = filters;

   // Determine week range
   const parseLocalZeroHour = (dateInput) => {
      const dStr = dateInput instanceof Date ? dateInput.toISOString().split('T')[0] : String(dateInput).split('T')[0];
      const [year, month, day] = dStr.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
   };

   const startOfWeek = weekStart ? parseLocalZeroHour(weekStart) : (() => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
   })();

   const endOfWeek = new Date(startOfWeek);
   endOfWeek.setDate(startOfWeek.getDate() + 6);
   endOfWeek.setHours(23, 59, 59, 999);

   const query = { date: { $gte: startOfWeek, $lte: endOfWeek } };

   if (classId) query.class = classId;

   // Teacher: lookup classes they are assigned to (sessions may not have teacher field set)
   if (teacherId) {
      const teacherClasses = await ClassMember.find({
         user: teacherId,
         role: 'teacher',
         status: 'active'
      }).select('class');
      // Merge with any existing classId filter
      const classIds = teacherClasses.map(m => m.class);
      query.class = classId
         ? { $in: classIds.filter(id => id.toString() === classId) }
         : { $in: classIds };
   }

   // Student: lookup their enrolled classes first
   if (studentId) {
      const memberships = await ClassMember.find({
         user: studentId,
         role: 'student',
         status: 'active'
      }).select('class');
      query.class = { $in: memberships.map(m => m.class) };
   }

   const sessions = await Session.find(query)
      .populate('class', 'name code level')
      .populate('teacher', 'firstName lastName email')
      .sort({ date: 1, startTime: 1 });

   // Group by day name
   const timetable = {};
   DAY_NAMES.forEach(d => { timetable[d] = []; });

   sessions.forEach(s => {
      // Parse YYYY-MM-DD directly to avoid UTC vs local timezone offset
      const dateStr = s.date instanceof Date
         ? s.date.toISOString().split('T')[0]
         : String(s.date).split('T')[0];
      const [year, month, day] = dateStr.split('-').map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay(); // local, no UTC shift
      const dayName = DAY_NAMES[dayOfWeek];
      timetable[dayName].push(s);
   });

   return {
      week: {
         start: startOfWeek.toISOString().split('T')[0],
         end: endOfWeek.toISOString().split('T')[0]
      },
      timetable
   };
};

/**
 * Bulk-generate Sessions for a class from its ScheduleTemplate
 * @param {string} classId
 * @param {string} templateId
 */
const generateSessionsFromTemplate = async (classId, templateId) => {
   const classData = await Class.findById(classId);
   if (!classData) throw ApiError.notFound('Class not found');

   const template = await ScheduleTemplate.findById(templateId);
   if (!template) throw ApiError.notFound('Schedule template not found');

   const { startDate, endDate } = classData;
   if (!startDate || !endDate) {
      throw ApiError.badRequest('Class must have startDate and endDate set');
   }

   const created = [];
   const roomConflicts = [];
   let sessionNumber = 1;

   // Get the highest existing sessionNumber to avoid conflicts
   const lastSession = await Session.findOne({ class: classId }).sort({ sessionNumber: -1 });
   if (lastSession) sessionNumber = lastSession.sessionNumber + 1;

   const current = new Date(startDate);
   const end = new Date(endDate);

   while (current <= end) {
      const dayOfWeek = current.getDay();
      const slots = template.schedule.filter(s => s.dayOfWeek === dayOfWeek);

      for (const slot of slots) {
         // Fallback for legacy templates missing slotNumber
         let targetSlotNum = slot.slotNumber;
         if (!targetSlotNum) {
            const { getSlotByStartTime } = require('../constants/slots');
            const matchSlot = getSlotByStartTime(slot.startTime);
            targetSlotNum = matchSlot ? matchSlot.slotNumber : 1;
         }

         // Resolve startTime/endTime from slotNumber
         const slotDef = getSlotByNumber(targetSlotNum);
         if (!slotDef) continue; // skip invalid slot

         // Check if session already exists on this date+class+slot
         const exists = await Session.findOne({
            class: classId,
            date: new Date(current),
            slotNumber: targetSlotNum
         });

         if (!exists) {
            // Class room takes priority over template slot room
            const roomName = classData.room || slot.room || '';
            if (roomName) {
               const dayStart = new Date(current); dayStart.setHours(0, 0, 0, 0);
               const dayEnd = new Date(current); dayEnd.setHours(23, 59, 59, 999);
               const roomConflict = await Session.findOne({
                  room: roomName,
                  slotNumber: targetSlotNum,
                  date: { $gte: dayStart, $lte: dayEnd }
               }).populate('class', 'name code');
               if (roomConflict) {
                  roomConflicts.push(
                     `Phòng "${roomName}" đã được đặt cho lớp ${roomConflict.class?.name || ''} ` +
                     `vào slot ${targetSlotNum} ngày ${current.toLocaleDateString('vi-VN')}`
                  );
                  sessionNumber++;
                  continue;
               }
            }

            const session = await Session.create({
               class: classId,
               title: `Buổi ${sessionNumber}`,
               sessionNumber,
               date: new Date(current),
               slotNumber: targetSlotNum,
               startTime: slot.startTime || slotDef.startTime,
               endTime: slot.endTime || slotDef.endTime,
               room: roomName,
               status: 'scheduled'
            });
            created.push(session);
            sessionNumber++;
         }
      }

      current.setDate(current.getDate() + 1);
   }

   // If any room conflicts were found, throw a combined error
   if (roomConflicts.length > 0) {
      if (created.length > 0) {
         await Session.deleteMany({ _id: { $in: created.map(s => s._id) } });
      }
      throw ApiError.conflict(
         `Không thể tạo lịch: phòng học bị trùng lịch (${roomConflicts.length} buổi):\n` +
         roomConflicts.slice(0, 5).join('\n') +
         (roomConflicts.length > 5 ? `\n... và ${roomConflicts.length - 5} buổi khác.` : '')
      );
   }

   return created;
};

/**
 * Automatically update session statuses based on current time
 * scheduled -> ongoing -> completed
 */
const autoUpdateStatuses = async () => {
   const now = new Date();
   const today = new Date(now);
   today.setHours(0, 0, 0, 0);

   const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5); // "HH:MM"

   // 1. Mark as 'ongoing'
   // Condition: Today + startTime <= now < endTime
   await Session.updateMany(
      {
         date: today,
         status: 'scheduled',
         startTime: { $lte: currentTimeStr },
         endTime: { $gt: currentTimeStr }
      },
      { status: 'ongoing' }
   );

   // 2. Mark as 'completed'
   // Condition: Past date OR (Today + endTime <= now)
   await Session.updateMany(
      {
         status: { $in: ['scheduled', 'ongoing'] },
         $or: [
            { date: { $lt: today } },
            { date: today, endTime: { $lte: currentTimeStr } }
         ]
      },
      { status: 'completed' }
   );
};

module.exports = {
   getAllSessions,
   getSessionById,
   createSession,
   updateSession,
   deleteSession,
   getClassSessions,
   addMaterial,
   getWeeklyTimetable,
   generateSessionsFromTemplate,
   autoUpdateStatuses,
   createMakeupSession
};
