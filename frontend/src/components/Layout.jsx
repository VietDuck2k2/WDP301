import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Layout.css';

const Layout = () => {
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
                                <span className="text">Thời khóa biểu</span>
                            </NavLink>
                        </li>
                        {user?.role === 'teacher' && (
                            <>
                                <li>
                                    <NavLink to="/teacher/sessions" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📋</span>
                                        <span className="text">Buổi học</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/teacher/attendance" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">✓</span>
                                        <span className="text">Điểm danh</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/teacher/assignments" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📝</span>
                                        <span className="text">Bài tập</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/teacher/announcements" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📢</span>
                                        <span className="text">Thông báo</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
                        {user?.role === 'student' && (
                            <>
                                <li>
                                    <NavLink to="/student/classes" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">🏫</span>
                                        <span className="text">Lớp học</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/student/assignments" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📝</span>
                                        <span className="text">Bài tập</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/student/grades" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📊</span>
                                        <span className="text">Điểm</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/student/attendance" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">✓</span>
                                        <span className="text">Điểm danh</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/student/announcements" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📢</span>
                                        <span className="text">Thông báo</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
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
