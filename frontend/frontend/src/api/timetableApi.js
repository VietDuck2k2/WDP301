import axiosInstance from './axios';

export const timetableApi = {
   // Admin - Timetable view
   getAdminTimetable: (params) => axiosInstance.get('/admin/timetable', { params }),
   generateSessions: (data) => axiosInstance.post('/admin/timetable/generate', data),

   // Admin - Session CRUD
   getSessions: (params) => axiosInstance.get('/admin/sessions', { params }),
   createSession: (data) => axiosInstance.post('/admin/sessions', data),
   updateSession: (id, data) => axiosInstance.put(`/admin/sessions/${id}`, data),
   deleteSession: (id) => axiosInstance.delete(`/admin/sessions/${id}`),
   createMakeupSession: (id, data) => axiosInstance.post(`/admin/sessions/${id}/makeup`, data),
   bulkAssignRoom: (data) => axiosInstance.post('/admin/sessions/bulk-room', data),

   // Admin - Schedule Templates
   getTemplates: () => axiosInstance.get('/admin/schedule-templates'),
   createTemplate: (data) => axiosInstance.post('/admin/schedule-templates', data),
   updateTemplate: (id, data) => axiosInstance.put(`/admin/schedule-templates/${id}`, data),
   deleteTemplate: (id) => axiosInstance.delete(`/admin/schedule-templates/${id}`),

   // Admin - Global Data Fetch (for dropdowns)
   getAdminClasses: () => axiosInstance.get('/admin/classes'),
   getAdminTeachers: () => axiosInstance.get('/admin/users/role/teacher'),
   getRooms: () => axiosInstance.get('/admin/rooms'),
   getAvailableRooms: (params) => axiosInstance.get('/admin/rooms/available', { params }),

   // Teacher APIs
   getTeacherTimetable: (params) => axiosInstance.get('/teacher/timetable', { params }),

   // Student APIs
   getStudentTimetable: (params) => axiosInstance.get('/student/timetable', { params }),
};

