import React, { useMemo, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { authApi } from '../api/authApi';

const adminNav = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { to: '/admin/users', label: 'Người dùng', icon: 'group' },
  { to: '/admin/classes', label: 'Lớp học', icon: 'school' },
  { to: '/admin/session-rooms', label: 'Gán phòng', icon: 'meeting_room' },
  { to: '/admin/rooms', label: 'Phòng học', icon: 'door_front' },
  { to: '/admin/templates', label: 'Mẫu lịch học', icon: 'view_timeline' },
  { to: '/admin/activity-logs', label: 'Nhật ký admin', icon: 'history' },
  { to: '/admin/attendance', label: 'Điểm danh', icon: 'fact_check' },
];

const teacherNav = [
  { to: '/teacher/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { to: '/teacher/timetable', label: 'Thời khóa biểu', icon: 'calendar_month' },
  { to: '/teacher/classes', label: 'Lớp học', icon: 'school' },
  { to: '/teacher/attendances', label: 'Điểm danh', icon: 'fact_check' },
  { to: '/teacher/assignments', label: 'Bài tập', icon: 'assignment' },
  { to: '/teacher/announcements', label: 'Thông báo', icon: 'campaign' },
];

const studentNav = [
  { to: '/student/dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { to: '/student/timetable', label: 'Thời khóa biểu', icon: 'calendar_month' },
  { to: '/student/classes', label: 'Khóa học', icon: 'school' },
  { to: '/student/assignments', label: 'Bài tập', icon: 'assignment' },
  { to: '/student/grades', label: 'Bảng điểm', icon: 'grading' },
  { to: '/student/attendances', label: 'Điểm danh', icon: 'fact_check' },
  { to: '/student/announcements', label: 'Thông báo', icon: 'campaign' },
];

// ── Change Password Modal ──
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-headline font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">key</span> Đổi mật khẩu
          </h3>
          <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {toast && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {toast.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
          {fields.map(({ key, label, showKey }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPwd[showKey] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={label}
                  required
                  autoComplete="new-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => toggle(showKey)}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">{showPwd[showKey] ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-container rounded-lg shadow-md shadow-primary/20 transition-all disabled:opacity-70" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Layout ──
const Layout = () => {
  const { user, logout } = useAuth();
  const [showChangePwd, setShowChangePwd] = useState(false);

  const nav = useMemo(() => {
    if (user?.role === 'admin') return adminNav;
    if (user?.role === 'teacher') return teacherNav;
    if (user?.role === 'student') return studentNav;
    return [];
  }, [user?.role]);

  return (
    <div className="flex min-h-screen font-body bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-100 dark:bg-slate-900 flex flex-col h-screen py-6 fixed left-0 top-0 overflow-y-auto z-50 border-r border-slate-200 dark:border-slate-800">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-headline leading-tight">ECM System</h1>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">{user?.role || 'Guest'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 mt-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mx-2 px-4 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-headline">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 mt-auto space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4 mx-4">
          <button
            onClick={() => setShowChangePwd(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">key</span> Đổi mật khẩu
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 w-full z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex justify-between items-center px-8 py-4 whisper-shadow border-b border-slate-100">
          <div className="flex items-center flex-1">
             {/* Optional Header Content / Breadcrumbs */}
             <div className="text-slate-500 font-medium text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">home</span> 
                <span>/</span> {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} Portal
             </div>
          </div>
          
          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 font-headline leading-none mb-1">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 font-label uppercase tracking-widest">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-lg ring-2 ring-primary-container shadow-sm">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </div>
  );
};

export default Layout;
