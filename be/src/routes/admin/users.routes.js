const express = require('express');
const router = express.Router();
const multer = require('multer');
const usersController = require('../../controllers/admin/users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validate, validateEmail, validateObjectId } = require('../../middlewares/validate.middleware');

// Multer with memoryStorage for Excel import (file stays in memory, never saved to disk)
const importUpload = multer({
   storage: multer.memoryStorage(),
   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
   fileFilter: (req, file, cb) => {
      const allowed = [
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-excel'
      ];
      if (allowed.includes(file.mimetype)) {
         cb(null, true);
      } else {
         cb(new Error('Chỉ chấp nhận file Excel (.xlsx)'), false);
      }
   }
});

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// @route   GET /api/admin/users
router.get('/', usersController.getAllUsers);

// @route   GET /api/admin/users/role/:role
router.get('/role/:role', usersController.getUsersByRole);

// --- Bulk Import routes (must be BEFORE /:id to avoid param conflicts) ---

// @route   GET /api/admin/users/import/template
router.get('/import/template', usersController.downloadImportTemplate);

// @route   POST /api/admin/users/import/preview
router.post('/import/preview', importUpload.single('file'), usersController.previewImport);

// @route   POST /api/admin/users/import/execute
router.post('/import/execute', usersController.executeBulkImport);

// --- Bulk action routes (must be BEFORE /:id) ---

// @route   POST /api/admin/users/bulk/delete
router.post('/bulk/delete', usersController.bulkDeleteUsers);

// @route   PATCH /api/admin/users/bulk/deactivate
router.patch('/bulk/deactivate', usersController.bulkDeactivateUsers);

// @route   PATCH /api/admin/users/bulk/activate
router.patch('/bulk/activate', usersController.bulkActivateUsers);

// @route   GET /api/admin/users/:id
router.get('/:id', validateObjectId('id'), usersController.getUserById);

// @route   POST /api/admin/users
router.post(
   '/',
   validate(['email', 'password', 'firstName', 'lastName', 'role']),
   validateEmail,
   usersController.createUser
);

// @route   PUT /api/admin/users/:id
router.put('/:id', validateObjectId('id'), usersController.updateUser);

// @route   PUT /api/admin/users/:id/reset-password
router.put('/:id/reset-password', validateObjectId('id'), usersController.adminResetPassword);

// @route   PATCH /api/admin/users/:id/deactivate
router.patch('/:id/deactivate', validateObjectId('id'), usersController.deactivateUser);

// @route   DELETE /api/admin/users/:id
router.delete('/:id', validateObjectId('id'), usersController.deleteUser);

module.exports = router;
