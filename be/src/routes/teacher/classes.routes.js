const express = require('express');
const router = express.Router();
const classesController = require('../../controllers/teacher/classes.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireTeacher } = require('../../middlewares/rbac.middleware');

router.use(authenticate, requireTeacher);

router.get('/', classesController.getMyClasses);
router.get('/:classId', classesController.getClassById);
router.get('/:classId/students', classesController.getClassStudents);
router.get('/:classId/sessions', classesController.getSessionsByClassId);

module.exports = router;
