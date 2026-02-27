const classService = require('../../services/class.service');
const ApiResponse = require('../../utils/apiResponse');

/**
 * @route   GET /api/admin/classes
 * @desc    Get all classes
 * @access  Private/Admin
 */
const getAllClasses = async (req, res, next) => {
   try {
      const result = await classService.getAllClasses(req.query);
      ApiResponse.ok(res, result);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/classes/:id
 * @desc    Get class by ID
 * @access  Private/Admin
 */
const getClassById = async (req, res, next) => {
   try {
      const classData = await classService.getClassById(req.params.id);
      ApiResponse.ok(res, classData);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/classes
 * @desc    Create new class
 * @access  Private/Admin
 */
const createClass = async (req, res, next) => {
   try {
      const classData = await classService.createClass(req.body);
      ApiResponse.created(res, classData, 'Class created successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   PUT /api/admin/classes/:id
 * @desc    Update class
 * @access  Private/Admin
 */
const updateClass = async (req, res, next) => {
   try {
      const classData = await classService.updateClass(req.params.id, req.body);
      ApiResponse.ok(res, classData, 'Class updated successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/admin/classes/:id
 * @desc    Delete class
 * @access  Private/Admin
 */
const deleteClass = async (req, res, next) => {
   try {
      const classData = await classService.deleteClass(req.params.id);
      ApiResponse.ok(res, classData, 'Class deleted successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/classes/:id/enroll
 * @desc    Enroll student in class
 * @access  Private/Admin
 */
const enrollStudent = async (req, res, next) => {
   try {
      const { studentId } = req.body;
      const enrollment = await classService.enrollStudent(req.params.id, studentId);
      ApiResponse.created(res, enrollment, 'Student enrolled successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   POST /api/admin/classes/:id/assign-teacher
 * @desc    Assign teacher to class
 * @access  Private/Admin
 */
const assignTeacher = async (req, res, next) => {
   try {
      const { teacherId } = req.body;
      const assignment = await classService.assignTeacher(req.params.id, teacherId);
      ApiResponse.created(res, assignment, 'Teacher assigned successfully');
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/admin/classes/:id/members
 * @desc    Get class members
 * @access  Private/Admin
 */
const getClassMembers = async (req, res, next) => {
   try {
      const members = await classService.getClassMembers(req.params.id, req.query.role);
      ApiResponse.ok(res, members);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   DELETE /api/admin/classes/:id/members/:memberId
 * @desc    Remove a member from class
 * @access  Private/Admin
 */
const removeMember = async (req, res, next) => {
   try {
      const result = await classService.removeMember(req.params.id, req.params.memberId);
      ApiResponse.ok(res, result, 'Member removed from class');
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getAllClasses,
   getClassById,
   createClass,
   updateClass,
   deleteClass,
   enrollStudent,
   assignTeacher,
   getClassMembers,
   removeMember
};
