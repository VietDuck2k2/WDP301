import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Timetable from './pages/Timetable';

// Teacher Imports
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherSessions from './pages/teacher/TeacherSessions';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import AssignmentDetail from './pages/teacher/AssignmentDetail';
import TeacherAnnouncements from './pages/teacher/TeacherAnnouncements';

// Student Imports
import StudentTimetable from './pages/student/StudentTimetable';
import StudentClasses from './pages/student/StudentClasses';
import StudentAssignments from './pages/student/StudentAssignments';
import AssignmentSubmit from './pages/student/AssignmentSubmit';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAnnouncements from './pages/student/StudentAnnouncements';

// Admin Imports
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Classes from './pages/admin/Classes';
import ClassDetail from './pages/admin/ClassDetail';
import Templates from './pages/admin/Templates';
import AttendanceAdmin from './pages/admin/AttendanceAdmin';
import Reports from './pages/admin/Reports';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<Layout />}>
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/classes" element={<Classes />} />
              <Route path="/admin/classes/:id" element={<ClassDetail />} />
              <Route path="/admin/templates" element={<Templates />} />
              <Route path="/admin/attendance" element={<AttendanceAdmin />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/timetable" element={<Timetable role="admin" />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher/timetable" element={<TeacherTimetable />} />
              <Route path="/teacher/sessions" element={<TeacherSessions />} />
              <Route path="/teacher/attendance" element={<TeacherAttendance />} />
              <Route path="/teacher/attendance/:sessionId" element={<TeacherAttendance />} />
              <Route path="/teacher/assignments" element={<TeacherAssignments />} />
              <Route path="/teacher/assignments/:id" element={<AssignmentDetail />} />
              <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/timetable" element={<StudentTimetable />} />
              <Route path="/student/classes" element={<StudentClasses />} />
              <Route path="/student/assignments" element={<StudentAssignments />} />
              <Route path="/student/assignments/:id/submit" element={<AssignmentSubmit />} />
              <Route path="/student/grades" element={<StudentGrades />} />
              <Route path="/student/attendance" element={<StudentAttendance />} />
              <Route path="/student/announcements" element={<StudentAnnouncements />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
