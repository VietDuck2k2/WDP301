import axiosInstance from './axios';

export const teacherApi = {
  // GET /teacher/timetable?week=2026-02-24 (week = ngày thứ 2 của tuần)
  getTimetable(week) {
    return axiosInstance.get('/teacher/timetable', { params: { week } });
  },

  // GET /teacher/sessions?classId=cls01&page=1
  getSessions(classId, page = 1) {
    return axiosInstance.get('/teacher/sessions', {
      params: { classId: classId || undefined, page },
    });
  },

  getSessionById(id) {
    return axiosInstance.get(`/teacher/sessions/${id}`);
  },

  updateSession(id, body) {
    return axiosInstance.put(`/teacher/sessions/${id}`, body);
  },

  addMaterial(id, body) {
    return axiosInstance.post(`/teacher/sessions/${id}/materials`, body);
  },

  getSessionAttendance(sessionId) {
    return axiosInstance.get(`/teacher/attendances/sessions/${sessionId}`);
  },

  bulkMarkAttendance(sessionId, attendanceList) {
    return axiosInstance.post(`/teacher/attendances/sessions/${sessionId}/bulk`, { attendanceList });
  },

  getStudentAttendanceSummary(studentId, classId) {
    return axiosInstance.get(`/teacher/attendances/students/${studentId}`, { params: { classId } });
  },

  getClasses() {
    return axiosInstance.get('/teacher/classes');
  },

  getAssignments(classId, page = 1) {
    const params = { page };
    if (classId) params.classId = classId;
    return axiosInstance.get('/teacher/assignments', { params });
  },

  getAssignmentById(id) {
    return axiosInstance.get(`/teacher/assignments/${id}`);
  },

  createAssignment(body) {
    return axiosInstance.post('/teacher/assignments', body);
  },

  getAssignmentSubmissions(assignmentId) {
    return axiosInstance.get(`/teacher/assignments/${assignmentId}/submissions`);
  },

  // POST /teacher/submissions/:id/grade
  gradeSubmission(submissionId, { score, feedback }) {
    return axiosInstance.post(`/teacher/submissions/${submissionId}/grade`, { score, feedback });
  },

  getAnnouncements() {
    return axiosInstance.get('/teacher/announcements');
  },

  createAnnouncement(body) {
    return axiosInstance.post('/teacher/announcements', body);
  },

  togglePinAnnouncement(id) {
    return axiosInstance.post(`/teacher/announcements/${id}/toggle-pin`);
  },
};
