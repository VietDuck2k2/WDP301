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

  getMySubmission(assignmentId) {
    return axiosInstance.get(`/student/submissions/assignments/${assignmentId}`);
  },

  submitAssignment(assignmentId, body) {
    return axiosInstance.post(`/student/submissions/assignments/${assignmentId}/submit`, body);
  },

  saveDraft(assignmentId, body) {
    return axiosInstance.post(`/student/submissions/assignments/${assignmentId}/save-draft`, body);
  },

  getMySubmissions(params = {}) {
    return axiosInstance.get('/student/submissions', { params });
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
