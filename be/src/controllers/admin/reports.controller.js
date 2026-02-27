const reportService = require('../../services/report.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/reports/attendance
 * @access  Private/Admin
 */
const getAttendanceReport = async (req, res, next) => {
   try {
      const data = await reportService.getAttendanceReport(req.query);
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/reports/assignments
 * @access  Private/Admin
 */
const getAssignmentReport = async (req, res, next) => {
   try {
      const data = await reportService.getAssignmentReport(req.query);
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/reports/overview
 * @access  Private/Admin
 */
const getOverviewReport = async (req, res, next) => {
   try {
      const data = await reportService.getOverviewReport();
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getAttendanceReport,
   getAssignmentReport,
   getOverviewReport
};
