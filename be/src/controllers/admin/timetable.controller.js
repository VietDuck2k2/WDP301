const sessionService = require('../../services/session.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/timetable
 * @desc    Get weekly timetable (all sessions), filter by classId, teacherId, weekStart
 * @access  Private/Admin
 */
const getTimetable = async (req, res, next) => {
   try {
      const { classId, teacherId, weekStart } = req.query;
      const result = await sessionService.getWeeklyTimetable({ classId, teacherId, weekStart });
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/timetable/generate
 * @desc    Bulk-generate sessions from a ScheduleTemplate for a class
 * @access  Private/Admin
 * @body    { classId, templateId }
 */
const generateSessions = async (req, res, next) => {
   try {
      // [IMPROVEMENT] Accept optional 'room' param to pre-assign room during generation
      const { classId, templateId, room } = req.body;
      const sessions = await sessionService.generateSessionsFromTemplate(classId, templateId, room || '');
      ApiResponse.created(res, sessions, `${sessions.length} sessions generated successfully`);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getTimetable,
   generateSessions
};
