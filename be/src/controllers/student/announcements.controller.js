const announcementService = require('../../services/announcement.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/student/classes/:classId/announcements
 * @desc    Get announcements for a class
 * @access  Private/Student
 */
const getClassAnnouncements = async (req, res, next) => {
  try {
    const announcements = await announcementService.getClassAnnouncements(req.params.classId);
    ApiResponse.ok(res, announcements);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/student/announcements/:id
 * @desc    Get announcement by ID
 * @access  Private/Student
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await announcementService.getAnnouncementById(req.params.id);
    ApiResponse.ok(res, announcement);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClassAnnouncements,
  getAnnouncementById
};
