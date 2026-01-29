const Announcement = require('../models/Announcement');
const Class = require('../models/Class');
const ApiError = require('../utils/apiError');

/**
 * Get all announcements with filters
 */
const getAllAnnouncements = async (filters = {}) => {
  const { classId, priority, createdBy, page = 1, limit = 20 } = filters;
  
  const query = { isPublished: true };
  
  if (classId) query.class = classId;
  if (priority) query.priority = priority;
  if (createdBy) query.createdBy = createdBy;

  const skip = (page - 1) * limit;
  
  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .populate('class', 'name code')
      .populate('createdBy', 'firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Announcement.countDocuments(query)
  ]);

  return {
    announcements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get announcement by ID
 */
const getAnnouncementById = async (announcementId) => {
  const announcement = await Announcement.findById(announcementId)
    .populate('class', 'name code')
    .populate('createdBy', 'firstName lastName email');
  
  if (!announcement) {
    throw ApiError.notFound('Announcement not found');
  }

  return announcement;
};

/**
 * Create new announcement
 */
const createAnnouncement = async (announcementData, createdBy) => {
  // Verify class exists
  const classData = await Class.findById(announcementData.class);
  if (!classData) {
    throw ApiError.notFound('Class not found');
  }

  const announcement = await Announcement.create({
    ...announcementData,
    createdBy
  });

  return announcement;
};

/**
 * Update announcement
 */
const updateAnnouncement = async (announcementId, updateData) => {
  const announcement = await Announcement.findByIdAndUpdate(
    announcementId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!announcement) {
    throw ApiError.notFound('Announcement not found');
  }

  return announcement;
};

/**
 * Delete announcement
 */
const deleteAnnouncement = async (announcementId) => {
  const announcement = await Announcement.findByIdAndDelete(announcementId);

  if (!announcement) {
    throw ApiError.notFound('Announcement not found');
  }

  return announcement;
};

/**
 * Get announcements for a class
 */
const getClassAnnouncements = async (classId) => {
  const announcements = await Announcement.find({ 
    class: classId, 
    isPublished: true 
  })
    .populate('createdBy', 'firstName lastName')
    .sort({ isPinned: -1, createdAt: -1 });

  return announcements;
};

/**
 * Pin/Unpin announcement
 */
const togglePin = async (announcementId) => {
  const announcement = await Announcement.findById(announcementId);
  
  if (!announcement) {
    throw ApiError.notFound('Announcement not found');
  }

  announcement.isPinned = !announcement.isPinned;
  await announcement.save();

  return announcement;
};

/**
 * Add attachment to announcement
 */
const addAttachment = async (announcementId, attachment) => {
  const announcement = await Announcement.findById(announcementId);
  
  if (!announcement) {
    throw ApiError.notFound('Announcement not found');
  }

  announcement.attachments.push(attachment);
  await announcement.save();

  return announcement;
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getClassAnnouncements,
  togglePin,
  addAttachment
};
