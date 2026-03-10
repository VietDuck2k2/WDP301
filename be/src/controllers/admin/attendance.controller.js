const adminAttendanceService = require('../../services/adminAttendance.service');
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
   getSessionAttendance,
   getStudentAttendanceSummary,
   updateAttendance,
   deleteAttendance
};
