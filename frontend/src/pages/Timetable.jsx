import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Timetable() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lịch học</h1>
      <p className="text-gray-500 mb-4">
        Chào {user?.firstName || 'bạn'}! Đây là trang lịch học (placeholder).
      </p>
      <div className="flex gap-4">
        {user?.role === 'teacher' && (
          <Link to="/teacher/timetable" className="text-blue-600 hover:underline">Đến Lịch giáo viên</Link>
        )}
        {user?.role === 'student' && (
          <Link to="/student/timetable" className="text-blue-600 hover:underline">Đến Lịch học sinh</Link>
        )}
      </div>
    </div>
  );
}
