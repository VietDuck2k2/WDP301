const config = require('../config/env');
const ApiError = require('../utils/apiError');

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
   next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

/**
 * Centralized error handler
 */
const errorHandler = (err, req, res, next) => {
   let error = err;

   // Map Mongo duplicate key errors (E11000) to 409 Conflict with friendly message.
   // This protects against race conditions when unique indexes are hit.
   if (error && (error.code === 11000 || error.code === 11001)) {
      const msg = String(error.message || '');
      const indexName = String(error.index || error.indexName || '');
      const keyPattern = error.keyPattern || {};

      const isTeacherSlot =
         msg.includes('teacher_date_slot_unique') ||
         indexName.includes('teacher_date_slot_unique') ||
         (keyPattern.teacher && keyPattern.date && keyPattern.slotNumber);

      const isRoomSlot =
         msg.includes('room_date_slot_unique') ||
         indexName.includes('room_date_slot_unique') ||
         (keyPattern.room && keyPattern.date && keyPattern.slotNumber);

      if (isTeacherSlot) {
         error = ApiError.conflict('Giáo viên bị trùng lịch ở khung giờ này. Vui lòng chọn khung giờ khác hoặc đổi giáo viên.');
      } else if (isRoomSlot) {
         error = ApiError.conflict('Phòng học bị trùng lịch ở khung giờ này. Vui lòng chọn phòng khác hoặc đổi khung giờ.');
      } else {
         error = ApiError.conflict('Dữ liệu bị trùng (duplicate). Vui lòng kiểm tra lại.');
      }
   }

   // If error is not an ApiError, convert it
   if (!(error instanceof ApiError)) {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal Server Error';
      error = new ApiError(statusCode, message);
   }

   // Log error in development
   if (config.nodeEnv === 'development') {
      console.error('❌ Error:', {
         message: error.message,
         statusCode: error.statusCode,
         stack: error.stack,
         details: error.details
      });
   }

   // Send error response
   res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(config.nodeEnv === 'development' && { stack: error.stack })
   });
};

module.exports = {
   notFound,
   errorHandler
};
