const express = require('express');
const router = express.Router();
const announcementsController = require('../../controllers/student/announcements.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireStudent } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and student role
router.use(authenticate, requireStudent);

// @route   GET /api/student/classes/:classId/announcements
router.get('/classes/:classId', validateObjectId('classId'), announcementsController.getClassAnnouncements);

// @route   GET /api/student/announcements/:id
router.get('/:id', validateObjectId('id'), announcementsController.getAnnouncementById);

module.exports = router;
