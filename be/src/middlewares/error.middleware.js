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
