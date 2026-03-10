const announcementService = require('../../services/announcement.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/teacher/announcements
 * @desc    Get teacher's announcements
 * @access  Private/Teacher
 */
const getMyAnnouncements = async (req, res, next) => {
   try {
      const result = await announcementService.getAllAnnouncements({
         ...req.query,
         createdBy: req.user._id
      });
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/teacher/announcements/:id
 * @desc    Get announcement by ID
 * @access  Private/Teacher
 */
const getAnnouncementById = async (req, res, next) => {
   try {
      const announcement = await announcementService.getAnnouncementById(req.params.id);
      ApiResponse.ok(res, announcement);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/announcements
 * @desc    Create new announcement
 * @access  Private/Teacher
 */
const createAnnouncement = async (req, res, next) => {
   try {
      const announcement = await announcementService.createAnnouncement(req.body, req.user._id);
      ApiResponse.created(res, announcement, 'Announcement created successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/teacher/announcements/:id
 * @desc    Update announcement
 * @access  Private/Teacher
 */
const updateAnnouncement = async (req, res, next) => {
   try {
      const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
      ApiResponse.ok(res, announcement, 'Announcement updated successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/teacher/announcements/:id
 * @desc    Delete announcement
 * @access  Private/Teacher
 */
const deleteAnnouncement = async (req, res, next) => {
   try {
      const announcement = await announcementService.deleteAnnouncement(req.params.id);
      ApiResponse.ok(res, announcement, 'Announcement deleted successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/teacher/announcements/:id/toggle-pin
 * @desc    Pin/Unpin announcement
 * @access  Private/Teacher
 */
const togglePin = async (req, res, next) => {
   try {
      const announcement = await announcementService.togglePin(req.params.id);
      ApiResponse.ok(res, announcement, 'Announcement pin status updated');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyAnnouncements,
   getAnnouncementById,
   createAnnouncement,
   updateAnnouncement,
   deleteAnnouncement,
   togglePin
};
