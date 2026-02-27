import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Timetable from './pages/Timetable';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Root Redirect to Login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes Wrapper */}
          <Route element={<Layout />}>
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/timetable" element={<Timetable role="admin" />} />
              {/* Add more admin routes here */}
            </Route>

            {/* Teacher Routes */}
            <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
              <Route path="/teacher/timetable" element={<Timetable role="teacher" />} />
              {/* Add more teacher routes here */}
            </Route>

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/timetable" element={<Timetable role="student" />} />
              {/* Add more student routes here */}
            </Route>
            
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
