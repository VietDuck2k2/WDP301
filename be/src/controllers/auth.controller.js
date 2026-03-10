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

module.exports = {
   register,
   login,
   refreshToken,
   logout
};
