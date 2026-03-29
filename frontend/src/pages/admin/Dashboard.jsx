import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios';
import { NavLink } from 'react-router-dom';

const defaultStats = {
  users: { total: 0, teachers: 0, students: 0 },
  classes: { total: 0, active: 0 },
  sessions: { today: 0 },
  attendance: { weekTotal: 0, weekPresent: 0, weekAttendanceRate: 0 },
  recentSessions: [],
};

const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/admin/dashboard/stats');
        if (res?.success && res?.data) {
          setStats({ ...defaultStats, ...res.data });
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8 fade-in">
      {/* Hero / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[2.5rem] font-extrabold font-headline text-on-surface leading-tight tracking-tight">Dashboard Overview</h2>
          <p className="text-on-surface-variant font-label mt-2">Tổng quan hệ thống và các hoạt động gần đây nhất.</p>
        </div>
        <div className="flex gap-3">
          <NavLink to="/admin/reports" className="bg-surface-container-lowest text-on-surface-variant font-headline font-semibold px-6 py-2.5 rounded-lg whisper-shadow border border-outline-variant/10 hover:bg-surface-container-low transition-colors">
              Xem Báo cáo
          </NavLink>
          <NavLink to="/admin/users" className="primary-gradient text-white font-headline font-semibold px-8 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">
              Quản lý Users
          </NavLink>
        </div>
      </div>

      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 : Total Users */}
        <div className="bg-surface-container-lowest p-6 rounded-xl whisper-shadow border border-outline-variant/10 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-primary-fixed/50 text-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">group</span>
            </div>
            <span className="text-on-surface-variant text-xs font-semibold px-3 py-1 bg-surface-container-low rounded-full">
              {loading ? '...' : `${stats.users.teachers} T • ${stats.users.students} S`}
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs font-label uppercase tracking-widest font-bold mb-1">Tổng Số User</p>
            <h3 className="text-4xl font-extrabold font-headline text-on-surface">{loading ? '...' : stats.users.total}</h3>
          </div>
        </div>

        {/* KPI 2 : Active Classes */}
        <div className="bg-surface-container-lowest p-6 rounded-xl whisper-shadow border border-outline-variant/10 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-secondary-container/30 text-secondary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <span className="text-on-surface-variant text-xs font-semibold px-3 py-1 bg-surface-container-low rounded-full">
              Từ {loading ? '...' : stats.classes.total} Lớp
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs font-label uppercase tracking-widest font-bold mb-1">Lớp Đang Hoạt Động</p>
            <h3 className="text-4xl font-extrabold font-headline text-on-surface">{loading ? '...' : stats.classes.active}</h3>
          </div>
        </div>

        {/* KPI 3 : Sessions Today */}
        <div className="bg-surface-container-lowest p-6 rounded-xl whisper-shadow border border-outline-variant/10 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-tertiary-fixed/50 text-tertiary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs font-label uppercase tracking-widest font-bold mb-1">Số Buổi Học Hôm Nay</p>
            <h3 className="text-4xl font-extrabold font-headline text-on-surface">{loading ? '...' : stats.sessions.today}</h3>
          </div>
        </div>

        {/* KPI 4 : Weekly Attendance */}
        <div className="bg-surface-container-lowest p-6 rounded-xl whisper-shadow border border-outline-variant/10 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <span className="text-emerald-700 text-xs font-bold font-label flex items-center bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
               {loading ? '...' : `${stats.attendance.weekPresent}/${stats.attendance.weekTotal}`}
            </span>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs font-label uppercase tracking-widest font-bold mb-1">Tỉ Lệ Điểm Danh (Tuần)</p>
            <h3 className="text-4xl font-extrabold font-headline text-on-surface">{loading ? '...' : `${stats.attendance.weekAttendanceRate}%`}</h3>
          </div>
        </div>
      </div>

      {/* Bottom Row / Table */}
      <div className="bg-surface-container-lowest rounded-xl whisper-shadow border border-outline-variant/10 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10 bg-white">
          <div>
            <h4 className="text-xl font-bold font-headline text-on-surface">Các buổi học gần đây</h4>
            <p className="text-on-surface-variant text-sm mt-1">{loading ? 'Đang tải...' : stats.recentSessions.length} buổi học ghi nhận trong khoảng thời gian vừa qua</p>
          </div>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg text-sm font-semibold text-slate-700">
            <span className="material-symbols-outlined text-[18px]">refresh</span> Tải lại
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Tên buổi học</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Lớp</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Giờ</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Phòng</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && stats.recentSessions.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">Không tìm thấy buổi học nào.</td>
                </tr>
              )}
              {stats.recentSessions.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">{item.title}</td>
                  <td className="py-4 px-6 text-slate-600">{item.class?.name || '-'}</td>
                  <td className="py-4 px-6 text-slate-600">{new Date(item.date).toLocaleDateString('vi-VN')}</td>
                  <td className="py-4 px-6 font-medium text-slate-700">{item.startTime} - {item.endTime}</td>
                  <td className="py-4 px-6 text-slate-600">{item.room || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'in_progress' ? 'bg-blue-100 text-primary' :
                      item.status === 'cancelled' ? 'bg-red-100 text-error' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
