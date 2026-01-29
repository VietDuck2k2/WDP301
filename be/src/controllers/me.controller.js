const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   GET /api/me
 * @desc    Get current user profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);
    ApiResponse.ok(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/me
 * @desc    Update current user profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    ApiResponse.ok(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/me/change-password
 * @desc    Change current user password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
    ApiResponse.ok(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
