import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const teacherNav = [
    { to: '/teacher/timetable', label: 'Lịch dạy' },
    { to: '/teacher/assignments', label: 'Bài tập' },
    { to: '/teacher/announcements', label: 'Thông báo' },
  ];

  const studentNav = [
    { to: '/student/classes', label: 'Lớp học' },
    { to: '/student/assignments', label: 'Bài tập' },
    { to: '/student/grades', label: 'Điểm số' },
    { to: '/student/attendance', label: 'Điểm danh' },
    { to: '/student/announcements', label: 'Thông báo' },
  ];

  const navItems = user?.role === 'teacher' ? teacherNav : user?.role === 'student' ? studentNav : [];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <Link to="/" className="text-xl font-bold text-blue-600">ECMS</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Tìm kiếm..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
