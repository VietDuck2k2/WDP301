const adminActivityLogService = require('../../services/adminActivityLog.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route GET /api/admin/activity-logs
 */
const getActivityLogs = async (req, res, next) => {
   try {
      const data = await adminActivityLogService.list({
         page: req.query.page,
         limit: req.query.limit,
         resourceType: req.query.resourceType,
         dateFrom: req.query.dateFrom,
         dateTo: req.query.dateTo
      });
      ApiResponse.ok(res, data);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getActivityLogs
};
