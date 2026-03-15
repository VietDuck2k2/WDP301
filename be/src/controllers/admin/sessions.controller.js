const sessionService = require('../../services/session.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/sessions
 * @desc    Get all sessions
 * @access  Private/Admin
 */
const getAllSessions = async (req, res, next) => {
   try {
      const result = await sessionService.getAllSessions(req.query);
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/sessions/:id
 * @desc    Get session by ID
 * @access  Private/Admin
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
 * @route   POST /api/admin/sessions
 * @desc    Create new session
 * @access  Private/Admin
 */
const createSession = async (req, res, next) => {
   try {
      const session = await sessionService.createSession(req.body);
      ApiResponse.created(res, session, 'Session created successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/admin/sessions/:id
 * @desc    Update session
 * @access  Private/Admin
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
 * @route   DELETE /api/admin/sessions/:id
 * @desc    Delete session
 * @access  Private/Admin
 */
const deleteSession = async (req, res, next) => {
   try {
      const session = await sessionService.deleteSession(req.params.id);
      ApiResponse.ok(res, session, 'Session deleted successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/sessions/:id/makeup
 * @desc    Create a make-up session for a cancelled session
 * @access  Private/Admin
 */
const createMakeupSession = async (req, res, next) => {
   try {
      const session = await sessionService.createMakeupSession(req.params.id, req.body);
      ApiResponse.created(res, session, 'Make-up session created successfully');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getAllSessions,
   getSessionById,
   createSession,
   updateSession,
   deleteSession,
   createMakeupSession
};
