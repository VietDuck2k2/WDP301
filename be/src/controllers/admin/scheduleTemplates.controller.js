const scheduleTemplateService = require('../../services/scheduleTemplate.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/schedule-templates
 * @desc    Get all schedule templates
 * @access  Private/Admin
 */
const getAllTemplates = async (req, res, next) => {
  try {
    const templates = await scheduleTemplateService.getAllTemplates(req.query.isActive);
    ApiResponse.ok(res, templates);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/schedule-templates/:id
 * @desc    Get schedule template by ID
 * @access  Private/Admin
 */
const getTemplateById = async (req, res, next) => {
  try {
    const template = await scheduleTemplateService.getTemplateById(req.params.id);
    ApiResponse.ok(res, template);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/schedule-templates
 * @desc    Create new schedule template
 * @access  Private/Admin
 */
const createTemplate = async (req, res, next) => {
  try {
    const template = await scheduleTemplateService.createTemplate(req.body);
    ApiResponse.created(res, template, 'Schedule template created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/schedule-templates/:id
 * @desc    Update schedule template
 * @access  Private/Admin
 */
const updateTemplate = async (req, res, next) => {
  try {
    const template = await scheduleTemplateService.updateTemplate(req.params.id, req.body);
    ApiResponse.ok(res, template, 'Schedule template updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/schedule-templates/:id
 * @desc    Delete schedule template
 * @access  Private/Admin
 */
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await scheduleTemplateService.deleteTemplate(req.params.id);
    ApiResponse.ok(res, template, 'Schedule template deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
