const express = require('express');
const router = express.Router();
const meController = require('../controllers/me.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

// All routes require authentication
router.use(authenticate);

// @route   GET /api/me
router.get('/', meController.getProfile);

// @route   PUT /api/me
router.put('/', meController.updateProfile);

// @route   POST /api/me/change-password
router.post(
   '/change-password',
   validate(['currentPassword', 'newPassword']),
   meController.changePassword
);

module.exports = router;
