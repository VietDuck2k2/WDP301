const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const filesRoutes = require('./files.routes');
const notificationsRoutes = require('./notifications.routes');

// Admin routes
const adminUsersRoutes = require('./admin/users.routes');
const adminClassesRoutes = require('./admin/classes.routes');
const adminScheduleTemplatesRoutes = require('./admin/scheduleTemplates.routes');
const adminSessionsRoutes = require('./admin/sessions.routes');
const adminTimetableRoutes = require('./admin/timetable.routes');
const adminDashboardRoutes = require('./admin/dashboard.routes');
const adminAttendancesRoutes = require('./admin/attendances.routes');
const adminReportsRoutes = require('./admin/reports.routes');
const adminRoomsRoutes = require('./admin/rooms.routes');

// Teacher routes
const teacherClassesRoutes = require('./teacher/classes.routes');
const teacherSessionsRoutes = require('./teacher/sessions.routes');
const teacherAttendancesRoutes = require('./teacher/attendances.routes');
const teacherAssignmentsRoutes = require('./teacher/assignments.routes');
const teacherAnnouncementsRoutes = require('./teacher/announcements.routes');
const teacherTimetableRoutes = require('./teacher/timetable.routes');

// Student routes
const studentClassesRoutes = require('./student/classes.routes');
const studentAssignmentsRoutes = require('./student/assignments.routes');
const studentSubmissionsRoutes = require('./student/submissions.routes');
const studentAnnouncementsRoutes = require('./student/announcements.routes');
const studentTimetableRoutes = require('./student/timetable.routes');
const studentAttendancesRoutes = require('./student/attendances.routes');
const studentGradesRoutes = require('./student/grades.routes');

// Public routes
router.use('/auth', authRoutes);

// Authenticated routes
router.use('/me', meRoutes);
router.use('/files', filesRoutes);
router.use('/notifications', notificationsRoutes);

// Admin routes
router.use('/admin/users', adminUsersRoutes);
router.use('/admin/classes', adminClassesRoutes);
router.use('/admin/schedule-templates', adminScheduleTemplatesRoutes);
router.use('/admin/sessions', adminSessionsRoutes);
router.use('/admin/timetable', adminTimetableRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/admin/attendances', adminAttendancesRoutes);
router.use('/admin/reports', adminReportsRoutes);
router.use('/admin/rooms', adminRoomsRoutes);

// Teacher routes
router.use('/teacher/classes', teacherClassesRoutes);
router.use('/teacher/sessions', teacherSessionsRoutes);
router.use('/teacher/attendances', teacherAttendancesRoutes);
router.use('/teacher/assignments', teacherAssignmentsRoutes);
router.use('/teacher/announcements', teacherAnnouncementsRoutes);
router.use('/teacher/timetable', teacherTimetableRoutes);

// Student routes
router.use('/student/classes', studentClassesRoutes);
router.use('/student/assignments', studentAssignmentsRoutes);
router.use('/student/submissions', studentSubmissionsRoutes);
router.use('/student/announcements', studentAnnouncementsRoutes);
router.use('/student/timetable', studentTimetableRoutes);
router.use('/student/attendances', studentAttendancesRoutes);
router.use('/student/grades', studentGradesRoutes);

module.exports = router;
