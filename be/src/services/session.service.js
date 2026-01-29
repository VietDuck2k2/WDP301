const Session = require('../models/Session');
const Class = require('../models/Class');
const ApiError = require('../utils/apiError');

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

  // Check for duplicate session number in class
  const existingSession = await Session.findOne({ 
    class: sessionData.class, 
    sessionNumber: sessionData.sessionNumber 
  });
  
  if (existingSession) {
    throw ApiError.conflict('Session number already exists for this class');
  }

  const session = await Session.create(sessionData);
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

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getClassSessions,
  addMaterial
};
