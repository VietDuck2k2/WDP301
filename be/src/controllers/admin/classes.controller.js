const classService = require('../../services/class.service');
const sessionService = require('../../services/session.service');
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
 * @desc    Create new class (auto-generates sessions if scheduleTemplate is provided)
 * @access  Private/Admin
 */
const createClass = async (req, res, next) => {
   try {
      const classData = await classService.createClass(req.body);

      // Auto-generate sessions from template if provided
      if (req.body.scheduleTemplate) {
         try {
            // [IMPROVEMENT] Forward optional defaultRoom so Admin can assign room at class creation time
            await sessionService.generateSessionsFromTemplate(
               classData._id.toString(),
               req.body.scheduleTemplate,
               req.body.defaultRoom || ''
            );
         } catch (genErr) {
            // FATAL: rollback class creation so DB stays consistent
            await classData.deleteOne();
            return next(genErr);
         }
      }

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
      const before = await classService.getClassById(req.params.id);

      const classData = await classService.updateClass(req.params.id, req.body);

      // Determine if schedule dates or template changed to regenerate sessions
      const startDateChanged = req.body.startDate && new Date(req.body.startDate).getTime() !== new Date(before.startDate).getTime();
      const endDateChanged = req.body.endDate && new Date(req.body.endDate).getTime() !== new Date(before.endDate).getTime();

      let templateChanged = false;
      if (req.body.scheduleTemplate !== undefined) {
         const oldTemplateStr = before.scheduleTemplate?._id?.toString() || before.scheduleTemplate?.toString() || '';
         templateChanged = req.body.scheduleTemplate !== oldTemplateStr;
      }

      if (startDateChanged || endDateChanged || templateChanged) {
         const Session = require('../../models/Session');
         // Delete all 'scheduled' sessions because schedule has changed
         await Session.deleteMany({ class: req.params.id, status: 'scheduled' });

         const templateToUse = req.body.scheduleTemplate || (before.scheduleTemplate ? before.scheduleTemplate._id || before.scheduleTemplate : null);
         if (templateToUse) {
            try {
               // [IMPROVEMENT] Forward optional defaultRoom on update too
               await sessionService.generateSessionsFromTemplate(
                  req.params.id,
                  templateToUse,
                  req.body.defaultRoom || ''
               );
            } catch (genErr) {
               return next(genErr);
            }
         }
      }

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
