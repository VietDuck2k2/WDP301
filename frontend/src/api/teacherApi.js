import axiosInstance from './axios';

function getWeekRange(weekStart) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export const teacherApi = {
  getTimetable(week) {
    const { startDate, endDate } = getWeekRange(week);
    return axiosInstance.get('/teacher/sessions', { params: { startDate, endDate } });
  },

  getSessions(classId, page = 1) {
    if (classId) {
      return axiosInstance.get(`/teacher/sessions/classes/${classId}`);
    }
    return axiosInstance.get('/teacher/sessions', { params: { page } });
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

  gradeSubmission(submissionId, { score, feedback }) {
    return axiosInstance.post(`/teacher/assignments/submissions/${submissionId}/grade`, { score, feedback });
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
