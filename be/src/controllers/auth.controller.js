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

module.exports = {
  register,
  login
};
