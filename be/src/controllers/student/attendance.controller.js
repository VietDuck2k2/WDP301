const attendanceService = require('../../services/attendance.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/student/attendances
 * @desc    Get all attendance records for the logged-in student
 * @access  Private/Student
 */
const getMyAttendances = async (req, res, next) => {
   try {
      const records = await attendanceService.getAttendanceRecords({
         studentId: req.user._id
      });
      ApiResponse.ok(res, records);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/attendances/summary
 * @desc    Get attendance summary stats for the logged-in student
 * @access  Private/Student
 */
const getMyAttendanceSummary = async (req, res, next) => {
   try {
      const summary = await attendanceService.getStudentAttendanceSummary(
         req.user._id
      );
      ApiResponse.ok(res, summary);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/attendances/classes/:classId
 * @desc    Get attendance records for the student in a specific class
 * @access  Private/Student
 */
const getMyAttendanceByClass = async (req, res, next) => {
   try {
      const summary = await attendanceService.getStudentAttendanceSummary(
         req.user._id,
         req.params.classId
      );
      ApiResponse.ok(res, summary);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyAttendances,
   getMyAttendanceSummary,
   getMyAttendanceByClass
};
