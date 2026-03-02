import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const teacherNav = [
    { to: '/teacher/timetable', label: 'Lịch dạy', icon: 'calendar_today' },
    { to: '/teacher/assignments', label: 'Bài tập', icon: 'assignment' },
    { to: '/teacher/announcements', label: 'Thông báo', icon: 'campaign' },
  ];

  const studentNav = [
    { to: '/student/classes', label: 'Lớp học', icon: 'school' },
    { to: '/student/assignments', label: 'Bài tập', icon: 'assignment' },
    { to: '/student/grades', label: 'Điểm số', icon: 'workspace_premium' },
    { to: '/student/attendance', label: 'Điểm danh', icon: 'fact_check' },
    { to: '/student/announcements', label: 'Thông báo', icon: 'campaign' },
  ];

  const adminNav = [{ to: '/', label: 'Trang chủ', icon: 'dashboard' }];
  const navItems = user?.role === 'teacher' ? teacherNav : user?.role === 'student' ? studentNav : user?.role === 'admin' ? adminNav : [];

  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white flex flex-col min-h-screen">
      {/* Top Header Bar - full width */}
      <header className="flex items-center justify-between flex-wrap gap-3 border-b border-[#e5e7eb] dark:border-[#2a3441] bg-white dark:bg-[#1a242f] px-6 lg:px-10 py-3 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link to="/" className="flex items-center gap-3 text-[#111418] dark:text-white hover:opacity-80 transition-opacity shrink-0">
            <div className="size-8 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-tight hidden sm:block">EduCenter</h2>
          </Link>
          <div className="hidden md:flex flex-1 min-w-0 max-w-md">
            <div className="flex w-full rounded-lg h-10 overflow-hidden bg-[#f0f2f4] dark:bg-[#1e293b]">
              <span className="material-symbols-outlined text-[#617589] flex items-center justify-center pl-4 text-xl">search</span>
              <input
                type="search"
                placeholder="Tìm kiếm lớp, học viên, bài tập..."
                className="flex-1 min-w-0 border-none bg-transparent px-3 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          {/* Main nav links in header (horizontal) */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.to)
                    ? 'text-primary font-bold border-b-2 border-primary pb-0.5'
                    : 'text-[#617589] dark:text-gray-400 hover:text-primary'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              className="flex items-center justify-center rounded-lg h-10 w-10 bg-[#f0f2f4] dark:bg-[#1e293b] text-[#111418] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Cài đặt"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-[#f0f2f4] dark:border-gray-700">
              <div className="bg-primary/20 aspect-square rounded-full size-10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-semibold text-[#111418] dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[#617589] dark:text-gray-400 truncate">
                  {user?.role === 'teacher' ? 'Giáo viên' : user?.role === 'student' ? 'Học viên' : 'Quản trị'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - section nav with icons */}
        <aside className="w-56 lg:w-64 flex-shrink-0 bg-white dark:bg-[#1a242f] border-r border-[#f0f2f4] dark:border-gray-800 flex flex-col p-4 hidden md:flex">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-[#617589] dark:text-gray-400 hover:bg-[#f0f2f4] dark:hover:bg-[#1e293b] hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                <span className={isActive(item.to) ? 'font-bold' : ''}>{item.label}</span>
              </Link>
            ))}
          </nav>

          {user?.role === 'student' && (
            <div className="mt-auto p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Mẹo học</p>
              <p className="text-xs text-[#617589] dark:text-gray-400 leading-relaxed">
                Nên hoàn thành bài tập trước hạn 24h để có thời gian xem lại.
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#f0f2f4] dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium text-[#617589] dark:text-gray-400 hover:bg-[#f0f2f4] dark:hover:bg-gray-800 hover:text-red-600 dark:hover:text-red-400"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1280px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
