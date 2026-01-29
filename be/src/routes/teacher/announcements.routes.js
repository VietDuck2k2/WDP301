const express = require('express');
const router = express.Router();
const announcementsController = require('../../controllers/teacher/announcements.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireTeacher } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and teacher role
router.use(authenticate, requireTeacher);

// @route   GET /api/teacher/announcements
router.get('/', announcementsController.getMyAnnouncements);

// @route   GET /api/teacher/announcements/:id
router.get('/:id', validateObjectId('id'), announcementsController.getAnnouncementById);

// @route   POST /api/teacher/announcements
router.post(
  '/',
  validate(['class', 'title', 'content']),
  announcementsController.createAnnouncement
);

// @route   PUT /api/teacher/announcements/:id
router.put('/:id', validateObjectId('id'), announcementsController.updateAnnouncement);

// @route   DELETE /api/teacher/announcements/:id
router.delete('/:id', validateObjectId('id'), announcementsController.deleteAnnouncement);

// @route   POST /api/teacher/announcements/:id/toggle-pin
router.post('/:id/toggle-pin', validateObjectId('id'), announcementsController.togglePin);

module.exports = router;
