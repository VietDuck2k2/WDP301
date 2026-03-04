import axiosInstance from './axios';

export const studentApi = {
   // Classes
   getClasses: () => axiosInstance.get('/student/classes'),
   getClassById: (id) => axiosInstance.get(`/student/classes/${id}`),

   // Timetable
   getTimetable: (params) => axiosInstance.get('/student/timetable', { params }),

   // Assignments
   getClassAssignments: (classId) => axiosInstance.get(`/student/assignments/classes/${classId}`),
   getAssignmentById: (id) => axiosInstance.get(`/student/assignments/${id}`),

   // Submissions
   getMySubmissions: (params) => axiosInstance.get('/student/submissions', { params }),
   getMySubmissionForAssignment: (assignmentId) => axiosInstance.get(`/student/submissions/assignments/${assignmentId}`),
   submitAssignment: (assignmentId, data) => axiosInstance.post(`/student/submissions/assignments/${assignmentId}/submit`, data),
   saveDraft: (assignmentId, data) => axiosInstance.post(`/student/submissions/assignments/${assignmentId}/save-draft`, data),

   // Grades
   getMyGrades: (params) => axiosInstance.get('/student/grades', { params }),
   getMyGradesByClass: (classId) => axiosInstance.get(`/student/grades/classes/${classId}`),

   // Attendances
   getMyAttendances: (params) => axiosInstance.get('/student/attendances', { params }),
   getMyAttendanceSummary: () => axiosInstance.get('/student/attendances/summary'),
   getMyAttendanceByClass: (classId) => axiosInstance.get(`/student/attendances/classes/${classId}`),

   // Announcements
   getClassAnnouncements: (classId) => axiosInstance.get(`/student/announcements/classes/${classId}`),
   getAnnouncementById: (id) => axiosInstance.get(`/student/announcements/${id}`),
};
