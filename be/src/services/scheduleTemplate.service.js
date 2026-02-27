const ScheduleTemplate = require('../models/ScheduleTemplate');
const ApiError = require('../utils/apiError');

/**
 * Get all schedule templates
 */
const getAllTemplates = async (isActive = true) => {
   const query = isActive !== undefined ? { isActive } : {};

   const templates = await ScheduleTemplate.find(query)
      .sort({ createdAt: -1 });

   return templates;
};

/**
 * Get template by ID
 */
const getTemplateById = async (templateId) => {
   const template = await ScheduleTemplate.findById(templateId);

   if (!template) {
      throw ApiError.notFound('Schedule template not found');
   }

   return template;
};

/**
 * Create new template
 */
const createTemplate = async (templateData) => {
   const template = await ScheduleTemplate.create(templateData);
   return template;
};

/**
 * Update template
 */
const updateTemplate = async (templateId, updateData) => {
   const template = await ScheduleTemplate.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true, runValidators: true }
   );

   if (!template) {
      throw ApiError.notFound('Schedule template not found');
   }

   return template;
};

/**
 * Delete template (soft delete)
 */
const deleteTemplate = async (templateId) => {
   const template = await ScheduleTemplate.findByIdAndUpdate(
      templateId,
      { isActive: false },
      { new: true }
   );

   if (!template) {
      throw ApiError.notFound('Schedule template not found');
   }

   return template;
};

module.exports = {
   getAllTemplates,
   getTemplateById,
   createTemplate,
   updateTemplate,
   deleteTemplate
};
