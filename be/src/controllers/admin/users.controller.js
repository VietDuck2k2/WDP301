const userService = require('../../services/user.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
   try {
      const result = await userService.getAllUsers(req.query);
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
const getUserById = async (req, res, next) => {
   try {
      const user = await userService.getUserById(req.params.id);
      ApiResponse.ok(res, user);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @access  Private/Admin
 */
const createUser = async (req, res, next) => {
   try {
      const user = await userService.createUser(req.body);
      ApiResponse.created(res, user, 'User created successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
   try {
      const user = await userService.updateUser(req.params.id, req.body);
      ApiResponse.ok(res, user, 'User updated successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Deactivate user
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
   try {
      const user = await userService.deleteUser(req.params.id);
      ApiResponse.ok(res, user, 'User deactivated successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/users/role/:role
 * @desc    Get users by role
 * @access  Private/Admin
 */
const getUsersByRole = async (req, res, next) => {
   try {
      const users = await userService.getUsersByRole(req.params.role);
      ApiResponse.ok(res, users);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getAllUsers,
   getUserById,
   createUser,
   updateUser,
   deleteUser,
   getUsersByRole
};
