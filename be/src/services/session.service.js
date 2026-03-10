const Session = require('../models/Session');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const ScheduleTemplate = require('../models/ScheduleTemplate');
const ApiError = require('../utils/apiError');
const { getSlotByNumber } = require('../constants/slots');

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

   const session = await Session.create(data);
   return session;
};

/**
 * Update session
 */
const updateSession = async (sessionId, updateData) => {
   const session = await Session.findByIdAndUpdate(
      sessionId,
      updateData,
      { new: true, runValidators: true }
   );

   if (!session) {
      throw ApiError.notFound('Session not found');
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
   const startOfWeek = weekStart ? new Date(weekStart) : (() => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const mon = new Date(now.setDate(diff));
      mon.setHours(0, 0, 0, 0);
      return mon;
   })();

   const endOfWeek = new Date(startOfWeek);
   endOfWeek.setDate(startOfWeek.getDate() + 6);
   endOfWeek.setHours(23, 59, 59, 999);

   const query = { date: { $gte: startOfWeek, $lte: endOfWeek } };

   if (classId) query.class = classId;
   if (teacherId) query.teacher = teacherId;

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
         // Resolve startTime/endTime from slotNumber
         const slotDef = getSlotByNumber(slot.slotNumber);
         if (!slotDef) continue; // skip invalid slot

         // Check if session already exists on this date+class+slot
         const exists = await Session.findOne({
            class: classId,
            date: new Date(current),
            slotNumber: slot.slotNumber
         });

         if (!exists) {
            const session = await Session.create({
               class: classId,
               title: `Buổi ${sessionNumber}`,
               sessionNumber,
               date: new Date(current),
               slotNumber: slot.slotNumber,
               startTime: slotDef.startTime,
               endTime: slotDef.endTime,
               room: slot.room || classData.room || '',
               status: 'scheduled'
            });
            created.push(session);
            sessionNumber++;
         }
      }

      current.setDate(current.getDate() + 1);
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
   autoUpdateStatuses
};
