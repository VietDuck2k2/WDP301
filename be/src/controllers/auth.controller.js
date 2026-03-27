const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
const register = async (req, res, next) => {
   try {
      const { email, password, firstName, lastName, role } = req.body;

      const result = await authService.register({
         email,
         password,
         firstName,
         lastName,
         role
      });

      ApiResponse.created(res, result, 'User registered successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
const login = async (req, res, next) => {
   try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      ApiResponse.ok(res, result, 'Login successful');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using a refresh token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
   try {
      const { refreshToken: token } = req.body;

      if (!token) {
         return next(require('../utils/apiError').badRequest('Refresh token is required'));
      }

      const result = await authService.refreshToken(token);
      ApiResponse.ok(res, result, 'Token refreshed successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke refresh token
 * @access  Public
 */
const logout = (req, res, next) => {
   try {
      const { refreshToken: token } = req.body;
      const result = authService.logout(token);
      ApiResponse.ok(res, result, 'Logged out successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password for logged-in user
 * @access  Private
 */
const changePassword = async (req, res, next) => {
   try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
         return next(require('../utils/apiError').badRequest('currentPassword and newPassword are required'));
      }
      if (newPassword.length < 6) {
         return next(require('../utils/apiError').badRequest('New password must be at least 6 characters'));
      }
      const result = await authService.changePassword(req.user._id, currentPassword, newPassword);
      ApiResponse.ok(res, result, 'Password changed successfully');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   register,
   login,
   refreshToken,
   logout,
   changePassword
};
