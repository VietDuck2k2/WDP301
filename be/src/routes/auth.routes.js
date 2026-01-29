const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate, validateEmail } = require('../middlewares/validate.middleware');

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

module.exports = router;
