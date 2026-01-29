const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const filesRoutes = require('./files.routes');

// Admin routes
const adminUsersRoutes = require('./admin/users.routes');
const adminClassesRoutes = require('./admin/classes.routes');
const adminScheduleTemplatesRoutes = require('./admin/scheduleTemplates.routes');
const adminSessionsRoutes = require('./admin/sessions.routes');

// Teacher routes
const teacherClassesRoutes = require('./teacher/classes.routes');
const teacherSessionsRoutes = require('./teacher/sessions.routes');
const teacherAttendancesRoutes = require('./teacher/attendances.routes');
const teacherAssignmentsRoutes = require('./teacher/assignments.routes');
const teacherAnnouncementsRoutes = require('./teacher/announcements.routes');

// Student routes
const studentClassesRoutes = require('./student/classes.routes');
const studentAssignmentsRoutes = require('./student/assignments.routes');
const studentSubmissionsRoutes = require('./student/submissions.routes');
const studentAnnouncementsRoutes = require('./student/announcements.routes');

// Public routes
router.use('/auth', authRoutes);

// Authenticated routes
router.use('/me', meRoutes);
router.use('/files', filesRoutes);

// Admin routes
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/classes', adminClassesRoutes);
router.use('/admin/schedule-templates', adminScheduleTemplatesRoutes);
router.use('/admin/sessions', adminSessionsRoutes);

// Teacher routes
router.use('/teacher/classes', teacherClassesRoutes);
router.use('/teacher/sessions', teacherSessionsRoutes);
router.use('/teacher/attendances', teacherAttendancesRoutes);
router.use('/teacher/assignments', teacherAssignmentsRoutes);
router.use('/teacher/announcements', teacherAnnouncementsRoutes);

// Student routes
router.use('/student/classes', studentClassesRoutes);
router.use('/student/assignments', studentAssignmentsRoutes);
router.use('/student/submissions', studentSubmissionsRoutes);
router.use('/student/announcements', studentAnnouncementsRoutes);

module.exports = router;
