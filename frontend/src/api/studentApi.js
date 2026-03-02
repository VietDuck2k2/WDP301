import axiosInstance from './axios';

export const studentApi = {
  getClasses() {
    return axiosInstance.get('/student/classes');
  },

  getClassAssignments(classId) {
    return axiosInstance.get(`/student/assignments/classes/${classId}`);
  },

  getAssignmentById(id) {
    return axiosInstance.get(`/student/assignments/${id}`);
  },

  // GET /student/assignments/:assignmentId/submission
  getMySubmission(assignmentId) {
    return axiosInstance.get(`/student/assignments/${assignmentId}/submission`);
  },

  // POST /student/assignments/:assignmentId/submit
  submitAssignment(assignmentId, body) {
    return axiosInstance.post(`/student/assignments/${assignmentId}/submit`, body);
  },

  // POST /student/assignments/:assignmentId/save-draft
  saveDraft(assignmentId, body) {
    return axiosInstance.post(`/student/assignments/${assignmentId}/save-draft`, body);
  },

  getMySubmissions(params = {}) {
    return axiosInstance.get('/student/submissions', { params });
  },

  // GET /student/grades
  getGrades() {
    return axiosInstance.get('/student/grades');
  },

  // GET /student/grades/classes/:classId
  getGradesByClass(classId) {
    return axiosInstance.get(`/student/grades/classes/${classId}`);
  },

  getAttendances() {
    return axiosInstance.get('/student/attendances');
  },

  getAttendanceSummary() {
    return axiosInstance.get('/student/attendances/summary');
  },

  getClassAnnouncements(classId) {
    return axiosInstance.get(`/student/announcements/classes/${classId}`);
  },
};
