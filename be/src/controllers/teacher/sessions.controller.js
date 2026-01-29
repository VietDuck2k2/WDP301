const sessionService = require('../../services/session.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/teacher/sessions
 * @desc    Get teacher's sessions
 * @access  Private/Teacher
 */
const getMySessions = async (req, res, next) => {
  try {
    const result = await sessionService.getAllSessions({
      ...req.query,
      teacherId: req.user._id
    });
    ApiResponse.ok(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/teacher/sessions/:id
 * @desc    Get session by ID
 * @access  Private/Teacher
 */
const getSessionById = async (req, res, next) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    ApiResponse.ok(res, session);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/teacher/classes/:classId/sessions
 * @desc    Get sessions for a class
 * @access  Private/Teacher
 */
const getClassSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getClassSessions(req.params.classId);
    ApiResponse.ok(res, sessions);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/teacher/sessions/:id
 * @desc    Update session
 * @access  Private/Teacher
 */
const updateSession = async (req, res, next) => {
  try {
    const session = await sessionService.updateSession(req.params.id, req.body);
    ApiResponse.ok(res, session, 'Session updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/teacher/sessions/:id/materials
 * @desc    Add material to session
 * @access  Private/Teacher
 */
const addMaterial = async (req, res, next) => {
  try {
    const session = await sessionService.addMaterial(req.params.id, req.body);
    ApiResponse.ok(res, session, 'Material added successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySessions,
  getSessionById,
  getClassSessions,
  updateSession,
  addMaterial
};
