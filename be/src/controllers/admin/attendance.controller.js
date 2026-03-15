const adminAttendanceService = require('../../services/adminAttendance.service');
const Session = require('../../models/Session');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/attendances
 * @access  Private/Admin
 */
const getAllAttendances = async (req, res, next) => {
   try {
      const result = await adminAttendanceService.getAllAttendances(req.query);
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/attendances/sessions/class/:classId
 * @access  Private/Admin
 */
const getSessionsByClassId = async (req, res, next) => {
   try {
      const { classId } = req.params;
      const sessions = await Session.find({ class: classId })
         .sort({ date: 1, startTime: 1 });

      ApiResponse.ok(res, sessions);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/attendances/sessions/:sessionId
 * @access  Private/Admin
 */
const getSessionAttendance = async (req, res, next) => {
   try {
      const data = await adminAttendanceService.getSessionAttendance(req.params.sessionId);
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/attendances/students/:studentId
 * @access  Private/Admin
 */
const getStudentAttendanceSummary = async (req, res, next) => {
   try {
      const data = await adminAttendanceService.getStudentAttendanceSummary(
         req.params.studentId,
         req.query.classId
      );
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/admin/attendances/:id
 * @access  Private/Admin
 */
const updateAttendance = async (req, res, next) => {
   try {
      const record = await adminAttendanceService.updateAttendance(req.params.id, req.body);
      ApiResponse.ok(res, record, 'Attendance updated successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/attendances/sessions/:sessionId/bulk
 * @access  Private/Admin
 */
const bulkMarkAttendance = async (req, res, next) => {
   try {
      // By using adminAttendanceService which merges from generic attendanceService
      // we bypass teacher verification since admin doesn't need to be in the class
      const { attendanceList } = req.body;
      const result = await adminAttendanceService.bulkMarkAttendance(
         req.params.sessionId,
         attendanceList,
         req.user._id // Admin who marked it
      );
      ApiResponse.ok(res, result, 'Attendance marked successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/admin/attendances/:id
 * @access  Private/Admin
 */
const deleteAttendance = async (req, res, next) => {
   try {
      const record = await adminAttendanceService.deleteAttendance(req.params.id);
      ApiResponse.ok(res, record, 'Attendance record deleted');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getAllAttendances,
   getSessionsByClassId,
   getSessionAttendance,
   getStudentAttendanceSummary,
   updateAttendance,
   bulkMarkAttendance,
   deleteAttendance
};
