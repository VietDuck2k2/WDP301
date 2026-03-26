const userService = require('../../services/user.service');
const importService = require('../../services/import.service');
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

/**
 * @route   GET /api/admin/users/import/template
 * @desc    Download Excel template for bulk student import
 * @access  Private/Admin
 */
const downloadImportTemplate = async (req, res, next) => {
   try {
      const buffer = importService.generateTemplate();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
      res.send(buffer);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/users/import/preview
 * @desc    Upload Excel file and preview parsed/validated rows
 * @access  Private/Admin
 */
const previewImport = async (req, res, next) => {
   try {
      if (!req.file) {
         return next(require('../../utils/apiError').badRequest('Vui lòng chọn file Excel'));
      }
      const result = await importService.parseAndValidate(req.file.buffer);
      ApiResponse.ok(res, result, 'Preview thành công');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/users/import/execute
 * @desc    Execute bulk import of student accounts
 * @access  Private/Admin
 */
const executeBulkImport = async (req, res, next) => {
   try {
      const { rows, defaultPassword } = req.body;
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
         return next(require('../../utils/apiError').badRequest('Không có dữ liệu để import'));
      }
      const result = await importService.executeImport(rows, defaultPassword || null);
      ApiResponse.ok(res, result, `Import hoàn tất: ${result.summary.success} thành công, ${result.summary.failed} lỗi`);
   } catch (error) {
      next(error);
   }
};

const adminResetPassword = async (req, res, next) => {
   try {
      const { newPassword } = req.body;
      await userService.adminResetPassword(req.params.id, newPassword);
      ApiResponse.ok(res, null, 'Password reset successfully');
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
   getUsersByRole,
   downloadImportTemplate,
   previewImport,
   executeBulkImport,
   adminResetPassword
};
