const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate, validateEmail } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');

// @route   POST /api/auth/register
router.post(
   '/register',
   validate(['email', 'password', 'firstName', 'lastName']),
   validateEmail,
   authController.register
);

// @route   POST /api/auth/login
router.post(
   '/login',
   validate(['email', 'password']),
   authController.login
);

// @route   POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// @route   POST /api/auth/logout
router.post('/logout', authController.logout);

// @route   PUT /api/auth/change-password  (Private)
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;
