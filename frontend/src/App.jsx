import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Timetable from './pages/Timetable';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherSessions from './pages/teacher/TeacherSessions';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import AssignmentDetail from './pages/teacher/AssignmentDetail';
import TeacherAnnouncements from './pages/teacher/TeacherAnnouncements';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentClasses from './pages/student/StudentClasses';
import StudentAssignments from './pages/student/StudentAssignments';
import AssignmentSubmit from './pages/student/AssignmentSubmit';
import StudentGrades from './pages/student/StudentGrades';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentAnnouncements from './pages/student/StudentAnnouncements';

function Home() {
  const { user } = useAuth();
  if (user?.role === 'teacher') return <Navigate to="/teacher/timetable" replace />;
  if (user?.role === 'student') return <Navigate to="/student/classes" replace />;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">
          {user?.role === 'admin' ? `Chào admin ${user.firstName}!` : 'Chào mừng bạn!'}
        </h1>
        <p className="text-[#617589] dark:text-gray-400">
          {user?.role === 'admin' ? 'Giao diện quản trị admin chưa có trong phiên bản này.' : 'Chọn mục trong menu để bắt đầu.'}
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']} />
        }
      >
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route
            element={<ProtectedRoute allowedRoles={['teacher']} />}
          >
            <Route path="/teacher/timetable" element={<TeacherTimetable />} />
            <Route path="/teacher/classes/:classId/sessions" element={<TeacherSessions />} />
            <Route path="/teacher/sessions/:sessionId/attendance" element={<TeacherAttendance />} />
            <Route path="/teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/teacher/assignments/:id" element={<AssignmentDetail />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
          </Route>
          <Route
            element={<ProtectedRoute allowedRoles={['student']} />}
          >
            <Route path="/student/timetable" element={<StudentTimetable />} />
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />
            <Route path="/student/assignments/:id/submit" element={<AssignmentSubmit />} />
            <Route path="/student/grades" element={<StudentGrades />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/announcements" element={<StudentAnnouncements />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
