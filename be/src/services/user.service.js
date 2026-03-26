const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * Get all users with filters
 */
const getAllUsers = async (filters = {}) => {
   const { role, isActive, search, page = 1, limit = 20 } = filters;

   // By default, admin list shows active users only.
   // Soft-deleted users (isActive=false) are hidden unless explicitly requested.
   const query = { isActive: true };

   if (role) query.role = role;
   if (isActive !== undefined && isActive !== '') {
      if (typeof isActive === 'boolean') {
         query.isActive = isActive;
      } else if (typeof isActive === 'string') {
         query.isActive = isActive.toLowerCase() === 'true';
      }
   }
   if (search) {
      query.$or = [
         { firstName: new RegExp(search, 'i') },
         { lastName: new RegExp(search, 'i') },
         { email: new RegExp(search, 'i') }
      ];
   }

   const skip = (page - 1) * limit;

   const [users, total] = await Promise.all([
      User.find(query)
         .select('-password')
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(parseInt(limit)),
      User.countDocuments(query)
   ]);

   return {
      users,
      pagination: {
         page: parseInt(page),
         limit: parseInt(limit),
         total,
         pages: Math.ceil(total / limit)
      }
   };
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
   const user = await User.findById(userId);

   if (!user) {
      throw ApiError.notFound('User not found');
   }

   return user;
};

/**
 * Create new user (admin only)
 */
const createUser = async (userData) => {
   const existingUser = await User.findOne({ email: userData.email, isActive: true });
   if (existingUser) {
      throw ApiError.conflict('Email already registered');
   }

   const user = await User.create(userData);
   return user;
};

/**
 * Update user
 */
const updateUser = async (userId, updateData) => {
   // Prevent password update through this method
   delete updateData.password;

   // If email is being changed, check uniqueness
   if (updateData.email) {
      const existing = await User.findOne({ email: updateData.email, _id: { $ne: userId }, isActive: true });
      if (existing) {
         throw ApiError.conflict('Email already registered by another user');
      }
   }

   const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
   );

   if (!user) {
      throw ApiError.notFound('User not found');
   }

   return user;
};

/**
 * Admin reset password (uses .save() to trigger bcrypt pre-hook)
 */
const adminResetPassword = async (userId, newPassword) => {
   if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters');
   }

   const user = await User.findById(userId);
   if (!user) {
      throw ApiError.notFound('User not found');
   }

   user.password = newPassword;
   await user.save();

   return user;
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (userId) => {
   const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
   );

   if (!user) {
      throw ApiError.notFound('User not found');
   }

   return user;
};

/**
 * Get users by role
 */
const getUsersByRole = async (role) => {
   const users = await User.find({ role, isActive: true })
      .select('firstName lastName email phone')
      .sort({ firstName: 1 });

   return users;
};

module.exports = {
   getAllUsers,
   getUserById,
   createUser,
   updateUser,
   adminResetPassword,
   deleteUser,
   getUsersByRole
};
