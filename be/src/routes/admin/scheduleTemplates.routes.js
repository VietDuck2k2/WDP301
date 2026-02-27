const express = require('express');
const router = express.Router();
const scheduleTemplatesController = require('../../controllers/admin/scheduleTemplates.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validate, validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// @route   GET /api/admin/schedule-templates
router.get('/', scheduleTemplatesController.getAllTemplates);

// @route   GET /api/admin/schedule-templates/:id
router.get('/:id', validateObjectId('id'), scheduleTemplatesController.getTemplateById);

// @route   POST /api/admin/schedule-templates
router.post(
   '/',
   validate(['name', 'schedule']),
   scheduleTemplatesController.createTemplate
);

// @route   PUT /api/admin/schedule-templates/:id
router.put('/:id', validateObjectId('id'), scheduleTemplatesController.updateTemplate);

// @route   DELETE /api/admin/schedule-templates/:id
router.delete('/:id', validateObjectId('id'), scheduleTemplatesController.deleteTemplate);

module.exports = router;
