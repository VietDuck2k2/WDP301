const express = require('express');
const router = express.Router();
const gradesController = require('../../controllers/student/grades.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireStudent } = require('../../middlewares/rbac.middleware');
const { validateObjectId } = require('../../middlewares/validate.middleware');

router.use(authenticate, requireStudent);

// @route   GET /api/student/grades
router.get('/', gradesController.getMyGrades);

// @route   GET /api/student/grades/classes/:classId
router.get('/classes/:classId', validateObjectId('classId'), gradesController.getMyGradesByClass);

module.exports = router;
