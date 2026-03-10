const ApiError = require('../utils/apiError');

/**
 * Check if user owns the resource or is admin
 * Expects resourceUserId to be set in req by controller
 */
const checkOwnership = (req, res, next) => {
   if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
   }

   // Admin bypass
   if (req.user.role === 'admin') {
      return next();
   }

   // Check if resourceUserId is set
   if (!req.resourceUserId) {
      return next(ApiError.internal('Resource ownership not verified'));
   }

   // Check ownership
   if (req.resourceUserId.toString() !== req.user._id.toString()) {
      return next(ApiError.forbidden('Access denied. You do not own this resource'));
   }

   next();
};

/**
 * Check if user is the resource owner OR has specific role
 */
const checkOwnershipOrRole = (...allowedRoles) => {
   return (req, res, next) => {
      if (!req.user) {
         return next(ApiError.unauthorized('Authentication required'));
      }

      // Check role first
      if (allowedRoles.includes(req.user.role)) {
         return next();
      }

      // Check ownership
      if (!req.resourceUserId) {
         return next(ApiError.internal('Resource ownership not verified'));
      }

      if (req.resourceUserId.toString() === req.user._id.toString()) {
         return next();
      }

      return next(ApiError.forbidden('Access denied'));
   };
};

module.exports = {
   checkOwnership,
   checkOwnershipOrRole
};
