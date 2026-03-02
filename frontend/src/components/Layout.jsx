import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
                        {user?.role === 'admin' && (
                            <>
                                <li>
                                    <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📊</span>
                                        <span className="text">Dashboard</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/users" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">👥</span>
                                        <span className="text">Users</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/classes" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">🏫</span>
                                        <span className="text">Classes</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/templates" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">🧩</span>
                                        <span className="text">Templates</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/attendance" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📝</span>
                                        <span className="text">Attendance</span>
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/reports" className={({isActive}) => isActive ? 'active' : ''}>
                                        <span className="icon">📈</span>
                                        <span className="text">Reports</span>
                                    </NavLink>
                                </li>
                            </>
                        )}
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
                </header>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
