const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const ApiError = require('../utils/apiError');

// Simple in-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

/**
 * Register new user
 */
const register = async (userData) => {
   // Check if user already exists
   const existingUser = await User.findOne({ email: userData.email });
   if (existingUser) {
      throw ApiError.conflict('Email already registered');
   }

   // Create user
   const user = await User.create(userData);

   // Generate token
   const token = generateToken(user._id);

   return {
      user,
      token
   };
};

/**
 * Login user
 */
const login = async (email, password) => {
   // Find user with password field
   const user = await User.findOne({ email }).select('+password');

   if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
   }

   if (!user.isActive) {
      throw ApiError.forbidden('Account is deactivated');
   }

   // Check password
   const isPasswordValid = await user.comparePassword(password);
   if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials');
   }

   // Update last login
   user.lastLogin = new Date();
   await user.save();

   // Generate token
   const token = generateToken(user._id);

   // Remove password from response
   user.password = undefined;

   return {
      user,
      token
   };
};

/**
 * Get current user profile
 */
const getProfile = async (userId) => {
   const user = await User.findById(userId);

   if (!user) {
      throw ApiError.notFound('User not found');
   }

   return user;
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
   // Prevent updating sensitive fields
   const allowedUpdates = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'address', 'avatar'];
   const updates = {};

   allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
         updates[field] = updateData[field];
      }
   });

   const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
   );

   if (!user) {
      throw ApiError.notFound('User not found');
   }

   return user;
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
   const user = await User.findById(userId).select('+password');

   if (!user) {
      throw ApiError.notFound('User not found');
   }

   // Verify current password
   const isPasswordValid = await user.comparePassword(currentPassword);
   if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
   }

   // Update password
   user.password = newPassword;
   await user.save();

   return { message: 'Password changed successfully' };
};

/**
 * Generate access JWT token (7d)
 */
const generateToken = (userId) => {
   return jwt.sign({ id: userId, type: 'access' }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
   });
};

/**
 * Generate refresh JWT token (30d)
 */
const generateRefreshToken = (userId) => {
   const secret = config.jwtRefreshSecret || config.jwtSecret + '_refresh';
   return jwt.sign({ id: userId, type: 'refresh' }, secret, {
      expiresIn: '30d'
   });
};

/**
 * Refresh access token using a valid refresh token
 */
const refreshToken = async (refreshTkn) => {
   let decoded;
   try {
      const secret = config.jwtRefreshSecret || config.jwtSecret + '_refresh';
      decoded = jwt.verify(refreshTkn, secret);
   } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
   }

   if (decoded.type !== 'refresh') {
      throw ApiError.unauthorized('Invalid token type');
   }

   if (tokenBlacklist.has(refreshTkn)) {
      throw ApiError.unauthorized('Refresh token has been revoked');
   }

   const user = await User.findById(decoded.id);
   if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or deactivated');
   }

   const newAccessToken = generateToken(user._id);
   const newRefreshToken = generateRefreshToken(user._id);

   // Blacklist old refresh token
   tokenBlacklist.add(refreshTkn);

   return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
};

/**
 * Logout - blacklist the refresh token
 */
const logout = (refreshTkn) => {
   if (refreshTkn) {
      tokenBlacklist.add(refreshTkn);
   }
   return { message: 'Logged out successfully' };
};

module.exports = {
   register,
   login,
   refreshToken,
   logout,
   getProfile,
   updateProfile,
   changePassword
};
