const attendanceService = require('../../services/attendance.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/teacher/sessions/:sessionId/attendance
 * @desc    Get attendance for a session
 * @access  Private/Teacher
 */
const getSessionAttendance = async (req, res, next) => {
   try {
      const attendance = await attendanceService.getSessionAttendance(req.params.sessionId);
      ApiResponse.ok(res, attendance);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/sessions/:sessionId/attendance
 * @desc    Mark attendance for a student
 * @access  Private/Teacher
 */
const markAttendance = async (req, res, next) => {
   try {
      const { studentId, status, notes, arrivedAt } = req.body;
      const attendance = await attendanceService.markAttendance(
         req.params.sessionId,
         studentId,
         { status, notes, arrivedAt },
         req.user._id
      );
      ApiResponse.created(res, attendance, 'Attendance marked successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/sessions/:sessionId/attendance/bulk
 * @desc    Mark attendance for multiple students
 * @access  Private/Teacher
 */
const bulkMarkAttendance = async (req, res, next) => {
   try {
      const { attendanceList } = req.body;
      const results = await attendanceService.bulkMarkAttendance(
         req.params.sessionId,
         attendanceList,
         req.user._id
      );
      ApiResponse.ok(res, results, 'Bulk attendance marked');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/students/:studentId/attendance
 * @desc    Get student attendance summary
 * @access  Private/Teacher
 */
const getStudentAttendanceSummary = async (req, res, next) => {
   try {
      const summary = await attendanceService.getStudentAttendanceSummary(
         req.params.studentId,
         req.query.classId
      );
      ApiResponse.ok(res, summary);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getSessionAttendance,
   markAttendance,
   bulkMarkAttendance,
   getStudentAttendanceSummary
};
