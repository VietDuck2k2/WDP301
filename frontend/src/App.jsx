import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Timetable from './pages/Timetable';
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
              <Route path="/teacher/timetable" element={<Timetable role="teacher" />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/timetable" element={<Timetable role="student" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
