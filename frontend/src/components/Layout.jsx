import React, { useMemo, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { authApi } from '../api/authApi';
import './Layout.css';

const adminNav = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: '📊' },
  { to: '/admin/users', label: 'Người dùng', icon: '👥' },
  { to: '/admin/classes', label: 'Lớp học', icon: '🏫' },
  { to: '/admin/session-rooms', label: 'Gán phòng lịch học', icon: '🏷️' },
  { to: '/admin/rooms', label: 'Phòng học', icon: '🚪' },
  { to: '/admin/templates', label: 'Mẫu lịch học', icon: '🧩' },
  { to: '/admin/attendance', label: 'Điểm danh', icon: '📝' },
];

const teacherNav = [
  { to: '/teacher/timetable', label: 'TKB', icon: '📅' },
  { to: '/teacher/classes', label: 'Lớp học', icon: '🏫' },
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

// ── Change Password Modal ──────────────────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return showToast('error', 'Mật khẩu xác nhận không khớp!');
    }
    if (form.newPassword.length < 6) {
      return showToast('error', 'Mật khẩu mới phải ít nhất 6 ký tự!');
    }
    setLoading(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      showToast('success', '✅ Đổi mật khẩu thành công!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(onClose, 1500);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đổi mật khẩu thất bại!';
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => setShowPwd((p) => ({ ...p, [key]: !p[key] }));

  const fields = [
    { key: 'currentPassword', label: 'Mật khẩu hiện tại', showKey: 'current' },
    { key: 'newPassword',     label: 'Mật khẩu mới',      showKey: 'newPwd'  },
    { key: 'confirmPassword', label: 'Xác nhận mật khẩu', showKey: 'confirm' },
  ];

  return (
    <div className="cpw-overlay" onClick={onClose}>
      <div className="cpw-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cpw-header">
          <h3>🔑 Đổi mật khẩu</h3>
          <button className="cpw-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {toast && <div className={`cpw-toast ${toast.type}`}>{toast.msg}</div>}

        <form onSubmit={handleSubmit} className="cpw-form" autoComplete="off">
          {fields.map(({ key, label, showKey }) => (
            <div className="cpw-field" key={key}>
              <label>{label}</label>
              <div className="cpw-input-wrap">
                <input
                  type={showPwd[showKey] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={label}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="cpw-eye"
                  onClick={() => toggle(showKey)}
                  aria-label="Toggle visibility"
                  tabIndex={-1}
                >
                  {showPwd[showKey] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          ))}

          <div className="cpw-actions">
            <button type="button" className="cpw-btn cancel" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="cpw-btn submit" disabled={loading}>
              {loading ? '⏳ Đang lưu...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Layout ─────────────────────────────────────────────────────────────────
const Layout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showChangePwd, setShowChangePwd] = useState(false);

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
          <button
            className="change-pwd-btn"
            onClick={() => setShowChangePwd(true)}
            title="Đổi mật khẩu"
          >
            <span className="icon">🔑</span>
            <span className="text">Đổi mật khẩu</span>
          </button>
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

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </div>
  );
};

export default Layout;
