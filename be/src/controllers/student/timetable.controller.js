const sessionService = require('../../services/session.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/student/timetable
 * @desc    Get logged-in student's weekly timetable (from enrolled classes)
 * @access  Private/Student
 */
const getMyTimetable = async (req, res, next) => {
   try {
      const { weekStart } = req.query;
      const result = await sessionService.getWeeklyTimetable({
         studentId: req.user._id,
         weekStart
      });
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

module.exports = { getMyTimetable };
