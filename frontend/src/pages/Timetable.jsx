import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Timetable() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Lịch học</h1>
        <p className="text-[#617589] dark:text-gray-400">
          Chào {user?.firstName || 'bạn'}! Chọn lịch giáo viên hoặc học sinh bên dưới.
        </p>
      </div>
      <div className="flex gap-3">
        {user?.role === 'teacher' && (
          <Link
            to="/teacher/timetable"
            className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90"
          >
            <span className="material-symbols-outlined">calendar_today</span>
            Lịch giáo viên
          </Link>
        )}
        {user?.role === 'student' && (
          <Link
            to="/student/timetable"
            className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90"
          >
            <span className="material-symbols-outlined">calendar_today</span>
            Lịch học sinh
          </Link>
        )}
      </div>
    </div>
  );
}
