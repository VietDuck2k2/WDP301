const sessionService = require('../../services/session.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/teacher/timetable
 * @desc    Get logged-in teacher's weekly timetable
 * @access  Private/Teacher
 */
const getMyTimetable = async (req, res, next) => {
   try {
      const { weekStart } = req.query;
      const result = await sessionService.getWeeklyTimetable({
         teacherId: req.user._id,
         weekStart
      });
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

module.exports = { getMyTimetable };
