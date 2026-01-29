const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/admin/users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/rbac.middleware');
const { validate, validateEmail, validateObjectId } = require('../../middlewares/validate.middleware');

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// @route   GET /api/admin/users
router.get('/', usersController.getAllUsers);

// @route   GET /api/admin/users/role/:role
router.get('/role/:role', usersController.getUsersByRole);

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

// @route   DELETE /api/admin/users/:id
router.delete('/:id', validateObjectId('id'), usersController.deleteUser);

module.exports = router;
