import axiosInstance from './axios';

export const adminApi = {
  getUsers: (params = {}) => axiosInstance.get('/admin/users', { params }),
  getUsersByRole: (role) => axiosInstance.get(`/admin/users/role/${role}`),
  createUser: (payload) => axiosInstance.post('/admin/users', payload),
  updateUser: (id, payload) => axiosInstance.put(`/admin/users/${id}`, payload),
  deleteUser: (id) => axiosInstance.delete(`/admin/users/${id}`),
  deactivateUser: (id) => axiosInstance.patch(`/admin/users/${id}/deactivate`),
  resetPassword: (id, newPassword) => axiosInstance.put(`/admin/users/${id}/reset-password`, { newPassword }),
  bulkDeleteUsers: (userIds) => axiosInstance.post('/admin/users/bulk/delete', { userIds }),
  bulkDeactivateUsers: (userIds) => axiosInstance.patch('/admin/users/bulk/deactivate', { userIds }),
  bulkActivateUsers: (userIds) => axiosInstance.patch('/admin/users/bulk/activate', { userIds }),

  // Bulk Student Import
  downloadImportTemplate: () => axiosInstance.get('/admin/users/import/template', { responseType: 'blob' }),
  previewImport: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/admin/users/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  executeImport: (payload) => axiosInstance.post('/admin/users/import/execute', payload),

  getClasses: (params = {}) => axiosInstance.get('/admin/classes', { params }),
  createClass: (payload) => axiosInstance.post('/admin/classes', payload),
  updateClass: (id, payload) => axiosInstance.put(`/admin/classes/${id}`, payload),
  deleteClass: (id) => axiosInstance.delete(`/admin/classes/${id}`),
  getClassById: (id) => axiosInstance.get(`/admin/classes/${id}`),
  getClassMembers: (id, role = '') => axiosInstance.get(`/admin/classes/${id}/members`, { params: role ? { role } : {} }),
  enrollStudent: (id, studentId) => axiosInstance.post(`/admin/classes/${id}/enroll`, { studentId }),
  assignTeacher: (id, teacherIdOrIds) => {
    const teacherIds = Array.isArray(teacherIdOrIds) ? teacherIdOrIds : [teacherIdOrIds];
    return axiosInstance.post(`/admin/classes/${id}/assign-teacher`, { teacherIds });
  },
  removeClassMember: (id, memberId) => axiosInstance.delete(`/admin/classes/${id}/members/${memberId}`),
  suggestClassCode: (level) => axiosInstance.get('/admin/classes/suggest-code', { params: { level } }),
  checkClassCode: (code) => axiosInstance.get('/admin/classes/check-code', { params: { code } }),

  getScheduleTemplates: () => axiosInstance.get('/admin/schedule-templates'),
  getScheduleTemplateById: (id) => axiosInstance.get(`/admin/schedule-templates/${id}`),
  createScheduleTemplate: (payload) => axiosInstance.post('/admin/schedule-templates', payload),
  updateScheduleTemplate: (id, payload) => axiosInstance.put(`/admin/schedule-templates/${id}`, payload),
  deleteScheduleTemplate: (id) => axiosInstance.delete(`/admin/schedule-templates/${id}`),

  generateSessions: (payload) => axiosInstance.post('/admin/timetable/generate', payload),

  getRooms: () => axiosInstance.get('/admin/rooms'),
  createRoom: (payload) => axiosInstance.post('/admin/rooms', payload),
  updateRoom: (id, payload) => axiosInstance.put(`/admin/rooms/${id}`, payload),
  deleteRoom: (id) => axiosInstance.delete(`/admin/rooms/${id}`),

  getAttendances: (params = {}) => axiosInstance.get('/admin/attendances', { params }),
  getSessionsByClassId: (classId) => axiosInstance.get(`/admin/attendances/sessions/class/${classId}`),
  getSessionAttendance: (sessionId) => axiosInstance.get(`/admin/attendances/sessions/${sessionId}`),
  updateAttendance: (id, payload) => axiosInstance.put(`/admin/attendances/${id}`, payload),
  postSessionAttendanceBulk: (sessionId, payload) => axiosInstance.post(`/admin/attendances/sessions/${sessionId}/bulk`, payload),

  getReportOverview: () => axiosInstance.get('/admin/reports/overview'),
  getAttendanceReport: (params = {}) => axiosInstance.get('/admin/reports/attendance', { params }),

  getDashboardMonthlyCharts: (year) =>
    axiosInstance.get('/admin/dashboard/charts/monthly', { params: year ? { year } : {} }),

  getActivityLogs: (params = {}) => axiosInstance.get('/admin/activity-logs', { params }),
};

export default adminApi;
