import React, { useMemo, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const adminNav = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: '📊' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥' },
  { to: '/admin/classes', label: 'Lớp học', icon: '🏫' },
  { to: '/admin/rooms', label: 'Phòng học', icon: '🚪' },
  { to: '/admin/templates', label: 'Mẫu lịch học', icon: '🧩' },
  { to: '/admin/attendance', label: 'Điểm danh', icon: '📝' },
  { to: '/admin/reports', label: 'Báo cáo', icon: '📈' },
];

const teacherNav = [
  { to: '/teacher/timetable', label: 'TKB', icon: '📅' },
  { to: '/teacher/classes', label: 'Lớp học', icon: '🏫' },
  { to: '/teacher/sessions', label: 'Buổi học', icon: '📚' },
  { to: '/teacher/attendances', label: 'Điểm danh', icon: '✓' },
  { to: '/teacher/assignments', label: 'Bài tập', icon: '📝' },
  { to: '/teacher/announcements', label: 'Thông báo', icon: '📢' },
];

const studentNav = [
  { to: '/student/timetable', label: 'TKB', icon: '📅' },
  { to: '/student/classes', label: 'Lớp học', icon: '🏫' },
  { to: '/student/assignments', label: 'Bài tập', icon: '📝' },
  { to: '/student/grades', label: 'Bảng điểm', icon: '📊' },
  { to: '/student/attendances', label: 'Điểm danh', icon: '✓' },
  { to: '/student/announcements', label: 'Thông báo', icon: '📢' },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const nav = useMemo(() => {
    if (user?.role === 'admin') return adminNav;
    if (user?.role === 'teacher') return teacherNav;
    if (user?.role === 'student') return studentNav;
    return [];
  }, [user?.role]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="layout">
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>ECM System</h2>
        </div>

        <div className="user-profile-section">
          <div className="avatar">{user?.firstName?.charAt(0) || 'U'}</div>
          <div className="user-info">
            <p className="user-name">{user?.firstName} {user?.lastName}</p>
            <p className="user-role">{user?.role}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <span className="icon">{item.icon}</span>
                  <span className="text">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <span className="icon">🚪</span>
            <span className="text">Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-content-wrapper">
        <header className="topbar">
          <button className="toggle-btn" onClick={toggleSidebar}>
            ☰
          </button>
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-actions">
            <NotificationBell />
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
