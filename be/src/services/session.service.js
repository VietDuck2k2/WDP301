const Session = require('../models/Session');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const ScheduleTemplate = require('../models/ScheduleTemplate');
const Attendance = require('../models/Attendance');
const ApiError = require('../utils/apiError');
const { getSlotByNumber } = require('../constants/slots');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * [IMPROVEMENT] Timezone-safe helper: parse a date (any format) to start-of-day in LOCAL time.
 * Avoids UTC vs local offset bugs that cause day-off-by-one errors.
 * @param {Date|string} dateInput
 * @returns {Date}
 */
const parseLocalZeroHour = (dateInput) => {
   const dStr = dateInput instanceof Date
      ? dateInput.toISOString().split('T')[0]
      : String(dateInput).split('T')[0];
   const [year, month, day] = dStr.split('-').map(Number);
   return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * [IMPROVEMENT] Normalize room name: trim + lowercase for consistent comparison.
 * Prevents phantom conflicts from ' A101' vs 'a101 ' differences.
 */
const normalizeRoom = (room) => (room ? String(room).trim() : '');

/**
 * Check if a teacher is already assigned at the same date + slotNumber.
 * @param {string} teacherId - Teacher user id
 * @param {Date|string} date - Session date
 * @param {number} slotNumber - Slot number
 * @param {string} [excludeSessionId] - Session ID to exclude (for updates)
 * @returns {string|null} - Returns conflict message, or null if clear
 */
const checkTeacherConflict = async (teacherId, date, slotNumber, excludeSessionId = null) => {
   if (!teacherId) return null; // no teacher assigned → no conflict possible
   if (slotNumber === undefined || slotNumber === null || slotNumber === '') return null;

   const normalizedSlotNumber = Number(slotNumber);
   if (!Number.isFinite(normalizedSlotNumber)) return null;

   const dayStart = parseLocalZeroHour(date);
   const dayEnd = new Date(dayStart);
   dayEnd.setHours(23, 59, 59, 999);

   const conflictQuery = {
      teacher: teacherId,
      slotNumber: normalizedSlotNumber,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'cancelled' }
   };
   if (excludeSessionId) conflictQuery._id = { $ne: excludeSessionId };

   const conflict = await Session.findOne(conflictQuery).populate('class', 'name code');
   if (conflict) {
      const msg = `Giáo viên đã được xếp cho lớp ${conflict.class?.name || ''} (${conflict.class?.code || ''}) ` +
         `vào slot ${slotNumber} ngày ${parseLocalZeroHour(date).toLocaleDateString('vi-VN')}.`;
      return msg;
   }
   return null;
};

/**
 * Throws if checkTeacherConflict returns a conflict message.
 */
const assertNoTeacherConflict = async (teacherId, date, slotNumber, excludeSessionId = null) => {
   const msg = await checkTeacherConflict(teacherId, date, slotNumber, excludeSessionId);
   if (msg) throw ApiError.conflict(msg);
};

/**
 * Check if a room is already booked at the same date + slotNumber.
 * @param {string} room - Room name
 * @param {Date|string} date - Session date
 * @param {number} slotNumber - Slot number
 * @param {string} [excludeSessionId] - Session ID to exclude (for updates)
 * @returns {string|null} - Returns conflict message, or null if clear
 */
const checkRoomConflict = async (room, date, slotNumber, excludeSessionId = null) => {
   const normalizedRoom = normalizeRoom(room);
   if (!normalizedRoom) return null; // no room assigned → no conflict possible
   if (slotNumber === undefined || slotNumber === null || slotNumber === '') return null;

   const normalizedSlotNumber = Number(slotNumber);
   if (!Number.isFinite(normalizedSlotNumber)) return null;

   // [FIX] Use shared timezone-safe helper
   const dayStart = parseLocalZeroHour(date);
   const dayEnd = new Date(dayStart);
   dayEnd.setHours(23, 59, 59, 999);

   const conflictQuery = {
      // [FIX] Compare against the normalized room name to avoid case/space mismatches
      room: { $regex: `^${normalizedRoom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      slotNumber: normalizedSlotNumber,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'cancelled' }
   };
   if (excludeSessionId) conflictQuery._id = { $ne: excludeSessionId };

   const conflict = await Session.findOne(conflictQuery).populate('class', 'name code');
   if (conflict) {
      const msg = `Phòng "${normalizedRoom}" đã được đặt cho lớp ${conflict.class?.name || ''} (${conflict.class?.code || ''}) ` +
         `vào slot ${slotNumber} ngày ${parseLocalZeroHour(date).toLocaleDateString('vi-VN')}.`;
      return msg; // [CHANGE] Return message instead of throwing, so callers can decide to collect or throw
   }
   return null;
};

/**
 * Throws if checkRoomConflict returns a conflict message.
 * Used by single-session create/update to maintain strict conflict enforcement.
 */
const assertNoRoomConflict = async (room, date, slotNumber, excludeSessionId = null) => {
   const msg = await checkRoomConflict(room, date, slotNumber, excludeSessionId);
   if (msg) throw ApiError.conflict(msg);
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

   // Check room conflict (strict: throw on conflict for single session create)
   await assertNoRoomConflict(data.room, data.date, data.slotNumber);
   // Check teacher conflict (cannot assign the same teacher to multiple classes in the same slot)
   await assertNoTeacherConflict(data.teacher, data.date, data.slotNumber);

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
   const teacher = updateData.teacher !== undefined ? updateData.teacher : existing.teacher;

   // Only check conflicts if the session is NOT being cancelled
   if (updateData.status !== 'cancelled') {
      await assertNoRoomConflict(room, date, slotNumber, sessionId);
      await assertNoTeacherConflict(teacher, date, slotNumber, sessionId);
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
   await assertNoRoomConflict(data.room, data.date, data.slotNumber);
   await assertNoTeacherConflict(data.teacher, data.date, data.slotNumber);

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
 * Bulk-assign a room to sessions of a class.
 * By default only assigns sessions that currently have empty room.
 * If overwrite=true, assigns for all sessions of that class.
 *
 * @param {string} classId
 * @param {string} room
 * @param {Object} [options]
 * @param {boolean} [options.overwrite=false]
 */
/**
 * Bulk-assign a room to sessions of a class.
 * [IMPROVEMENT] Now uses "Best-effort" strategy:
 * - Assigns the room for ALL sessions that don't conflict.
 * - Returns a summary with { updatedCount, conflictedSessions } instead of throwing.
 * - Only throws on hard errors (class not found, room empty).
 *
 * @param {string} classId
 * @param {string} room
 * @param {Object} [options]
 * @param {boolean} [options.overwrite=false] - If true, overwrite existing room assignments too
 * @returns {{ updatedCount: number, conflictedSessions: Array }}
 */
const bulkAssignRoomToClassSessions = async (classId, room, options = {}) => {
   const { overwrite = false } = options;

   const classData = await Class.findById(classId);
   if (!classData) throw ApiError.notFound('Class not found');

   const normalizedRoom = normalizeRoom(room);
   if (!normalizedRoom) {
      throw ApiError.badRequest('room là bắt buộc');
   }

   const query = { class: classId, status: { $ne: 'cancelled' } };
   if (!overwrite) {
      // Only target sessions without a room assignment
      query.$or = [{ room: { $exists: false } }, { room: '' }, { room: null }];
   }

   const sessions = await Session.find(query).select('_id date slotNumber room class title');

   if (sessions.length === 0) {
      return { updatedCount: 0, conflictedSessions: [], message: 'Không có buổi học nào cần gán phòng.' };
   }

   // [IMPROVEMENT] Best-effort: check each session individually, collect conflicts instead of throwing
   const toUpdate = [];
   const conflictedSessions = [];

   for (const s of sessions) {
      const conflictMsg = await checkRoomConflict(normalizedRoom, s.date, s.slotNumber, s._id);
      if (conflictMsg) {
         conflictedSessions.push({
            sessionId: s._id,
            title: s.title,
            date: parseLocalZeroHour(s.date).toLocaleDateString('vi-VN'),
            reason: conflictMsg
         });
      } else {
         toUpdate.push(s._id);
      }
   }

   // Assign to all clear sessions
   let updatedCount = 0;
   if (toUpdate.length > 0) {
      const result = await Session.updateMany(
         { _id: { $in: toUpdate } },
         { room: normalizedRoom }
      );
      updatedCount = result.modifiedCount ?? result.nModified ?? 0;
   }

   return {
      updatedCount,
      conflictedSessions,
      message: conflictedSessions.length > 0
         ? `Đã gán phòng "${normalizedRoom}" cho ${updatedCount} buổi học. ${conflictedSessions.length} buổi bị trùng lịch không thể gán.`
         : `Đã gán phòng "${normalizedRoom}" thành công cho ${updatedCount} buổi học.`
   };
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

   // Chỉ buổi đã gán giáo viên cụ thể (session.teacher); không suy ra từ thành viên lớp.
   if (teacherId) {
      query.teacher = teacherId;
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

   // Student timetable: attach attendance status per session card
   let attendanceMap = new Map();
   if (studentId && sessions.length > 0) {
      const sessionIds = sessions.map(s => s._id);
      const attendanceRows = await Attendance.find({
         student: studentId,
         session: { $in: sessionIds }
      }).select('session status');

      attendanceMap = new Map(
         attendanceRows.map(row => [row.session.toString(), row.status])
      );
   }

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

      const sessionObj = s.toObject ? s.toObject() : s;
      if (studentId) {
         sessionObj.attendanceStatus = attendanceMap.get(String(s._id)) || null;
      }
      timetable[dayName].push(sessionObj);
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
/**
 * Bulk-generate Sessions for a class from its ScheduleTemplate.
 * [IMPROVEMENT] Accepts an optional `defaultRoom` parameter so Admin can
 * pre-assign a room while generating the schedule — eliminating the need
 * for a manual Bulk Assign step after generation.
 *
 * @param {string} classId
 * @param {string} templateId
 * @param {string} [defaultRoom] - Optional room name to assign to all new sessions
 */
const generateSessionsFromTemplate = async (classId, templateId, defaultRoom = '') => {
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
            // [FIX] Use the passed-in defaultRoom instead of the hardcoded empty string.
            // This fixes the "Dead Code" bug where room assignment was always skipped.
            const roomName = normalizeRoom(defaultRoom);

            // [FIX] Check room conflict only if a room was actually provided (not empty)
            if (roomName) {
               const conflictMsg = await checkRoomConflict(roomName, new Date(current), targetSlotNum);
               if (conflictMsg) {
                  roomConflicts.push(conflictMsg);
                  sessionNumber++;
                  continue; // Skip this session but continue generating others
               }
            }

            // Giáo viên từng buổi để trống — gán sau qua admin (Gán giáo viên buổi dạy).
            const session = await Session.create({
               class: classId,
               title: `Buổi ${sessionNumber}`,
               sessionNumber,
               date: new Date(current),
               slotNumber: targetSlotNum,
               startTime: slot.startTime || slotDef.startTime,
               endTime: slot.endTime || slotDef.endTime,
               room: roomName, // Assign room (may be empty string if not provided)
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
   bulkAssignRoomToClassSessions,
   getClassSessions,
   addMaterial,
   getWeeklyTimetable,
   generateSessionsFromTemplate,
   autoUpdateStatuses,
   createMakeupSession
};
