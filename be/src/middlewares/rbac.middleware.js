const ApiError = require('../utils/apiError');

/**
 * Role-Based Access Control middleware
 * Check if user has required role(s)
 */
const requireRole = (...allowedRoles) => {
   return (req, res, next) => {
      if (!req.user) {
         return next(ApiError.unauthorized('Authentication required'));
      }

      if (!allowedRoles.includes(req.user.role)) {
         return next(ApiError.forbidden(`Access denied. Required role: ${allowedRoles.join(' or ')}`));
      }

      next();
   };
};

/**
 * Specific role checkers
 */
const requireAdmin = requireRole('admin');
const requireTeacher = requireRole('teacher', 'admin');
const requireStudent = requireRole('student', 'teacher', 'admin');

module.exports = {
   requireRole,
   requireAdmin,
   requireTeacher,
   requireStudent
};
