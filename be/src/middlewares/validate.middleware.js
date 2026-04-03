const ApiError = require('../utils/apiError');

/**
 * Simple validation middleware for MVP
 * Checks if required fields are present in request body
 */
const validate = (requiredFields = []) => {
   return (req, res, next) => {
      const errors = [];

      requiredFields.forEach(field => {
         // Handle nested fields (e.g., 'user.email')
         const fieldPath = field.split('.');
         let value = req.body;

         for (const key of fieldPath) {
            value = value?.[key];
         }

         if (value === undefined || value === null || value === '') {
            errors.push(`${field} is required`);
         }
      });

      if (errors.length > 0) {
         return next(ApiError.validationError(errors));
      }

      next();
   };
};

/**
 * Validate email format
 */
const validateEmail = (req, res, next) => {
   const { email } = req.body;

   if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         return next(ApiError.badRequest('Invalid email format'));
      }
   }

   next();
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
   return (req, res, next) => {
      const id = req.params[paramName];
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;

      if (!objectIdRegex.test(id)) {
         return next(ApiError.badRequest(`Invalid ${paramName} format`));
      }

      next();
   };
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDate = (fieldName) => {
   return (req, res, next) => {
      const dateValue = req.body[fieldName] || req.query[fieldName];

      if (dateValue) {
         // Accept either YYYY-MM-DD or full ISO strings (YYYY-MM-DDTHH:mm...)
         const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}.*)?$/;
         if (!dateRegex.test(dateValue)) {
            return next(ApiError.badRequest(`${fieldName} must be a valid date or datetime (YYYY-MM-DD or ISO format)`));
         }

         const date = new Date(dateValue);
         if (isNaN(date.getTime())) {
            return next(ApiError.badRequest(`${fieldName} is not a valid date`));
         }
      }

      next();
   };
};

/**
 * Validate time format (HH:MM)
 */
const validateTime = (fieldName) => {
   return (req, res, next) => {
      const timeValue = req.body[fieldName];

      if (timeValue) {
         const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
         if (!timeRegex.test(timeValue)) {
            return next(ApiError.badRequest(`${fieldName} must be in HH:MM format`));
         }
      }

      next();
   };
};

module.exports = {
   validate,
   validateEmail,
   validateObjectId,
   validateDate,
   validateTime
};
