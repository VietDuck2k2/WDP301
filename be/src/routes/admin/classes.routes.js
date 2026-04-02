const express = require('express');
const router = express.Router();
const classesController = require('../../controllers/admin/classes.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId, validateDate } = require('../../middlewares/validate.middleware');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// @route   GET /api/admin/classes
router.get('/', classesController.getAllClasses);

// @route   GET /api/admin/classes/suggest-code?level=beginner
// MUST come before /:id to prevent Express treating 'suggest-code' as an id
router.get('/suggest-code', classesController.suggestCode);

// @route   GET /api/admin/classes/check-code?code=BEG004
router.get('/check-code', classesController.checkCode);

// @route   GET /api/admin/classes/:id
router.get('/:id', validateObjectId('id'), classesController.getClassById);

// @route   POST /api/admin/classes
router.post(
   '/',
   validate(['name', 'code', 'level', 'capacity', 'startDate', 'endDate']),
   validateDate('startDate'),
   validateDate('endDate'),
   classesController.createClass
);

// @route   PUT /api/admin/classes/:id
router.put('/:id', validateObjectId('id'), classesController.updateClass);

// @route   DELETE /api/admin/classes/:id
router.delete('/:id', validateObjectId('id'), classesController.deleteClass);

// @route   POST /api/admin/classes/:id/enroll
router.post(
   '/:id/enroll',
   validateObjectId('id'),
   validate(['studentId']),
   classesController.enrollStudent
);

// @route   POST /api/admin/classes/:id/assign-teacher
router.post(
   '/:id/assign-teacher',
   validateObjectId('id'),
   classesController.assignTeacher
);

// @route   GET /api/admin/classes/:id/members
router.get('/:id/members', validateObjectId('id'), classesController.getClassMembers);

// @route   DELETE /api/admin/classes/:id/members/:memberId
router.delete('/:id/members/:memberId', validateObjectId('id'), validateObjectId('memberId'), classesController.removeMember);

module.exports = router;
