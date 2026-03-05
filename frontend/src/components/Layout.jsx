import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const teacherNav = [
  { to: '/teacher/timetable', label: 'TKB', icon: '📅' },
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
    const nav = user?.role === 'teacher' ? teacherNav : user?.role === 'student' ? studentNav : [{ to: `/${user?.role}/timetable`, label: 'TKB', icon: '📅' }];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
                        <li>
                            <NavLink to={`/${user?.role}/timetable`} className={({isActive}) => isActive ? 'active' : ''}>
                                <span className="icon">📅</span> 
                                <span className="text">Weekly Timetable</span>
                            </NavLink>
                        </li>
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
                    <div className="topbar-title">
                        Dashboard
                    </div>
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
