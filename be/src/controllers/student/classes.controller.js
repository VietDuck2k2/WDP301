const classService = require('../../services/class.service');
const ClassMember = require('../../models/ClassMember');
const Session = require('../../models/Session');
const ApiResponse = require('../../utils/apiResponse');
const ApiError = require('../../utils/apiError');

/**
 * @route   GET /api/student/classes
 * @desc    Get student's enrolled classes
 * @access  Private/Student
 */
const getMyClasses = async (req, res, next) => {
   try {
      const studentId = req.user._id;

      // Find active memberships for this student
      const memberships = await ClassMember.find({
         user: studentId,
         role: 'student',
         status: 'active'
      }).populate({
         path: 'class',
         populate: { path: 'scheduleTemplate' }
      });

      const rawClasses = memberships.map(m => m.class).filter(c => c && c.isActive);

      // Attach rich data for UI
      const classes = await Promise.all(rawClasses.map(async (c) => {
         const [teachers, enrolledCount, sessionCount] = await Promise.all([
            ClassMember.find({ class: c._id, role: 'teacher', status: 'active' })
               .populate('user', 'firstName lastName email avatar')
               .lean(),
            ClassMember.countDocuments({ class: c._id, role: 'student', status: 'active' }),
            Session.countDocuments({ class: c._id })
         ]);

         const cObj = c.toObject ? c.toObject() : c;

         return {
            ...cObj,
            teachers: teachers.map(t => t.user).filter(u => u),
            studentsCount: enrolledCount,
            sessionCount: sessionCount,
            students: Array(enrolledCount).fill({}),
            sessions: Array(sessionCount).fill({}),
            course: { name: 'Chương trình học', courseCode: 'ENG' }
         };
      }));

      ApiResponse.ok(res, classes);
   } catch (error) {
      next(error);
   }
};

/**
 * @route   GET /api/student/classes/:id
 * @desc    Get class by ID
 * @access  Private/Student
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
 * @route   GET /api/student/classes/:id/students
 * @desc    Get list of active students in a class (student must be enrolled)
 * @access  Private/Student
 */
const getClassStudents = async (req, res, next) => {
   try {
      const classId = req.params.id;
      const studentId = req.user._id;

      // Security check: Verify the student is enrolled in this class
      const isEnrolled = await ClassMember.exists({
         class: classId,
         user: studentId,
         role: 'student',
         status: 'active'
      });

      if (!isEnrolled) {
         throw ApiError.forbidden('Bạn không thuộc lớp này.');
      }

      const rawMembers = await ClassMember.find({
         class: classId,
         role: 'student',
         status: 'active'
      }).populate('user', 'firstName lastName email phone code avatar');

      const students = rawMembers.map(m => m.user).filter(u => u);
      ApiResponse.ok(res, students);
   } catch (error) {
      next(error);
   }
};

module.exports = {
   getMyClasses,
   getClassById,
   getClassStudents
};
