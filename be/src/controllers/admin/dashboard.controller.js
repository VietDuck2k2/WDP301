const dashboardService = require('../../services/dashboard.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get admin dashboard statistics
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res, next) => {
   try {
      const stats = await dashboardService.getDashboardStats();
      ApiResponse.ok(res, stats);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/dashboard/charts/monthly?year=
 */
const getMonthlyCharts = async (req, res, next) => {
   try {
      const data = await dashboardService.getMonthlyCharts(req.query.year);
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getDashboardStats,
   getMonthlyCharts
};
