import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import adminApi from '../../api/adminApi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const defaultStats = {
  users: { total: 0, teachers: 0, students: 0 },
  classes: { total: 0, active: 0 },
  sessions: { today: 0 },
  attendance: { weekTotal: 0, weekPresent: 0, weekAttendanceRate: 0 },
  recentClasses: [],
};

const CLASS_LEVEL_VI = {
  beginner: 'Cơ bản',
  elementary: 'Sơ cấp',
  intermediate: 'Trung cấp',
  'upper-intermediate': 'Trung cấp cao',
  advanced: 'Nâng cao',
};

const CLASS_STATUS_VI = {
  draft: 'Bản nháp',
  active: 'Đang học',
  completed: 'Đã kết thúc',
  cancelled: 'Đã hủy',
};

const chartTooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
};

const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [chartYear, setChartYear] = useState(currentYear);
  const [chartData, setChartData] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  const yearOptions = useMemo(() => {
    const years = [];
    const start = Math.min(2020, currentYear - 1);
    for (let y = currentYear + 1; y >= start; y--) years.push(y);
    return years;
  }, [currentYear]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/admin/dashboard/stats');
        if (res?.success && res?.data) {
          setStats({
            ...defaultStats,
            ...res.data,
            recentClasses: Array.isArray(res.data.recentClasses) ? res.data.recentClasses : [],
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCharts = async () => {
      setChartsLoading(true);
      try {
        const res = await adminApi.getDashboardMonthlyCharts(chartYear);
        if (!cancelled && res?.success && res?.data) {
          setChartData(res.data);
        }
      } catch (e) {
        console.error('Failed to load monthly charts:', e);
        if (!cancelled) setChartData(null);
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    };
    loadCharts();
    return () => {
      cancelled = true;
    };
  }, [chartYear]);

  return (
    <div className="space-y-8 fade-in">
      {/* Hero / Welcome Header */}
      <div>
        <h2 className="text-[2.5rem] font-extrabold font-headline text-on-surface leading-tight tracking-tight">Dashboard Overview</h2>
        <p className="text-on-surface-variant font-label mt-2">Tổng quan hệ thống và các hoạt động gần đây nhất.</p>
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

      {/* Charts: user growth + classes created (by month, filter by year) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Biểu đồ theo tháng</h3>
            <p className="text-on-surface-variant text-sm mt-1">
              Dữ liệu theo năm dương lịch (thời điểm tạo tài khoản / tạo lớp trong hệ thống).
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
            <span className="text-on-surface-variant font-medium">Năm</span>
            <select
              value={chartYear}
              onChange={(e) => setChartYear(Number(e.target.value))}
              className="rounded-lg border border-outline-variant/30 bg-white px-3 py-2 text-on-surface shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none min-w-[120px]"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl whisper-shadow border border-outline-variant/10">
            <h4 className="text-lg font-bold font-headline text-on-surface mb-1">
              Giáo viên &amp; học viên mới theo tháng
            </h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Số tài khoản được tạo trong từng tháng (năm {chartData?.year ?? chartYear}).
            </p>
            <div className="h-[300px] w-full">
              {chartsLoading ? (
                <div className="h-full flex items-center justify-center text-on-surface-variant text-sm font-medium">
                  Đang tải biểu đồ...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData?.usersByMonth || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" width={36} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value, name) => [value, name === 'teachers' ? 'Giáo viên' : 'Học viên']}
                      labelFormatter={(_, payload) => {
                        const m = payload?.[0]?.payload?.month;
                        return m ? `Tháng ${m}` : _;
                      }}
                    />
                    <Legend
                      formatter={(value) => (value === 'teachers' ? 'Giáo viên' : 'Học viên')}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="teachers" name="teachers" stroke="#0037b0" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="students" name="students" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl whisper-shadow border border-outline-variant/10">
            <h4 className="text-lg font-bold font-headline text-on-surface mb-1">Lớp học tạo mới theo tháng</h4>
            <p className="text-xs text-on-surface-variant mb-4">
              Số lớp được khởi tạo trong hệ thống theo tháng (năm {chartData?.year ?? chartYear}).
            </p>
            <div className="h-[300px] w-full">
              {chartsLoading ? (
                <div className="h-full flex items-center justify-center text-on-surface-variant text-sm font-medium">
                  Đang tải biểu đồ...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData?.classesByMonth || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" width={36} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(value) => [value, 'Số lớp']}
                      labelFormatter={(_, payload) => {
                        const m = payload?.[0]?.payload?.month;
                        return m ? `Tháng ${m}` : _;
                      }}
                    />
                    <Legend formatter={() => 'Lớp mới'} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="classes" name="classes" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row / Table — recently created classes */}
      <div className="bg-surface-container-lowest rounded-xl whisper-shadow border border-outline-variant/10 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10 bg-white">
          <div>
            <h4 className="text-xl font-bold font-headline text-on-surface">Các lớp tạo gần đây nhất</h4>
            <p className="text-on-surface-variant text-sm mt-1">
              {loading ? 'Đang tải...' : `${stats.recentClasses.length} lớp mới nhất theo thời điểm tạo trong hệ thống`}
            </p>
          </div>
          <button type="button" onClick={() => window.location.reload()} className="flex items-center gap-2 px-4 py-2 bg-surface-container-low hover:bg-surface-container-high transition-colors rounded-lg text-sm font-semibold text-slate-700">
            <span className="material-symbols-outlined text-[18px]">refresh</span> Tải lại
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Tên lớp</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Mã lớp</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Trình độ</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày tạo</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Khai giảng</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && stats.recentClasses.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">Chưa có lớp học nào trong hệ thống.</td>
                </tr>
              )}
              {stats.recentClasses.map((cls) => (
                <tr key={cls._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    <NavLink to={`/admin/classes/${cls._id}`} className="text-primary hover:underline">
                      {cls.name}
                    </NavLink>
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-mono text-sm">{cls.code || '—'}</td>
                  <td className="py-4 px-6 text-slate-600">{CLASS_LEVEL_VI[cls.level] || cls.level || '—'}</td>
                  <td className="py-4 px-6 text-slate-600">
                    {cls.createdAt ? new Date(cls.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {cls.startDate ? new Date(cls.startDate).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        cls.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : cls.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : cls.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {CLASS_STATUS_VI[cls.status] || cls.status || '—'}
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
