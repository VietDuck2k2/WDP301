import axiosInstance from './axios';

export const teacherApi = {
   // Timetable
   getTimetable: (params) => axiosInstance.get('/teacher/timetable', { params }),

   // Classes
   getMyClasses: () => axiosInstance.get('/teacher/classes'),
   getClassById: (id) => axiosInstance.get(`/teacher/classes/${id}`),
   getClassStudents: (classId) => axiosInstance.get(`/teacher/classes/${classId}/students`),
   getSessionsByClassId: (classId) => axiosInstance.get(`/teacher/classes/${classId}/sessions`),

   // Sessions
   getSessions: (params) => axiosInstance.get('/teacher/sessions', { params }),
   getSessionById: (id) => axiosInstance.get(`/teacher/sessions/${id}`),
   getClassSessions: (classId) => axiosInstance.get(`/teacher/sessions/classes/${classId}`),
   updateSession: (id, data) => axiosInstance.put(`/teacher/sessions/${id}`, data),
   addSessionMaterial: (id, data) => axiosInstance.post(`/teacher/sessions/${id}/materials`, data),

   // Attendances
   getSessionAttendance: (sessionId) => axiosInstance.get(`/teacher/attendances/sessions/${sessionId}`),
   postSessionAttendanceBulk: (sessionId, data) => axiosInstance.post(`/teacher/attendances/sessions/${sessionId}/bulk`, data),
   getStudentAttendanceSummary: (studentId, params) => axiosInstance.get(`/teacher/attendances/students/${studentId}`, { params }),

   // Assignments
   getAssignments: (params) => axiosInstance.get('/teacher/assignments', { params }),
   getAssignmentById: (id) => axiosInstance.get(`/teacher/assignments/${id}`),
   createAssignment: (data) => axiosInstance.post('/teacher/assignments', data),
   updateAssignment: (id, data) => axiosInstance.put(`/teacher/assignments/${id}`, data),
   deleteAssignment: (id) => axiosInstance.delete(`/teacher/assignments/${id}`),
   publishAssignment: (id) => axiosInstance.post(`/teacher/assignments/${id}/publish`),
   getAssignmentSubmissions: (id) => axiosInstance.get(`/teacher/assignments/${id}/submissions`),
   gradeSubmission: (submissionId, data) => axiosInstance.post(`/teacher/assignments/submissions/${submissionId}/grade`, data),

   // Announcements
   getAnnouncements: (params) => axiosInstance.get('/teacher/announcements', { params }),
   getAnnouncementById: (id) => axiosInstance.get(`/teacher/announcements/${id}`),
   createAnnouncement: (data) => axiosInstance.post('/teacher/announcements', data),
   updateAnnouncement: (id, data) => axiosInstance.put(`/teacher/announcements/${id}`, data),
   deleteAnnouncement: (id) => axiosInstance.delete(`/teacher/announcements/${id}`),
   toggleAnnouncementPin: (id) => axiosInstance.post(`/teacher/announcements/${id}/toggle-pin`),
};
