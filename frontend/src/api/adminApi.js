import axiosInstance from './axios';

export const adminApi = {
  getUsers: (params = {}) => axiosInstance.get('/admin/users', { params }),
  getUsersByRole: (role) => axiosInstance.get(`/admin/users/role/${role}`),
  createUser: (payload) => axiosInstance.post('/admin/users', payload),
  updateUser: (id, payload) => axiosInstance.put(`/admin/users/${id}`, payload),
  deleteUser: (id) => axiosInstance.delete(`/admin/users/${id}`),

  getClasses: (params = {}) => axiosInstance.get('/admin/classes', { params }),
  createClass: (payload) => axiosInstance.post('/admin/classes', payload),
  updateClass: (id, payload) => axiosInstance.put(`/admin/classes/${id}`, payload),
  deleteClass: (id) => axiosInstance.delete(`/admin/classes/${id}`),
  getClassById: (id) => axiosInstance.get(`/admin/classes/${id}`),
  getClassMembers: (id, role = '') => axiosInstance.get(`/admin/classes/${id}/members`, { params: role ? { role } : {} }),
  enrollStudent: (id, studentId) => axiosInstance.post(`/admin/classes/${id}/enroll`, { studentId }),
  assignTeacher: (id, teacherId) => axiosInstance.post(`/admin/classes/${id}/assign-teacher`, { teacherId }),
  removeClassMember: (id, memberId) => axiosInstance.delete(`/admin/classes/${id}/members/${memberId}`),

  getScheduleTemplates: () => axiosInstance.get('/admin/schedule-templates'),

  getAttendances: (params = {}) => axiosInstance.get('/admin/attendances', { params }),
  getSessionAttendance: (sessionId) => axiosInstance.get(`/admin/attendances/sessions/${sessionId}`),
  updateAttendance: (id, payload) => axiosInstance.put(`/admin/attendances/${id}`, payload),

  getReportOverview: () => axiosInstance.get('/admin/reports/overview'),
  getAttendanceReport: (params = {}) => axiosInstance.get('/admin/reports/attendance', { params }),
};

export default adminApi;
