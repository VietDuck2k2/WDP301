import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import { useAuth } from '../../context/AuthContext';

const LEVEL_LABEL = {
  beginner: 'Cơ bản',
  elementary: 'Sơ cấp',
  intermediate: 'Trung cấp',
  'upper-intermediate': 'Trung cấp cao',
  advanced: 'Nâng cao',
};

const normalizeAssignmentsPayload = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.assignments)) return data.assignments;
  return [];
};

const TeacherDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    classes: [],
    pendingSubmissions: [],
    recentAnnouncements: [],
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [classesRes, assignmentsRes, announcementsRes] = await Promise.all([
          teacherApi.getMyClasses().catch(() => null),
          teacherApi.getAssignments({ limit: 40 }).catch(() => null),
          teacherApi.getAnnouncements().catch(() => null),
        ]);

        const classes = classesRes?.success && Array.isArray(classesRes.data) ? classesRes.data : [];
        const allAssignments = normalizeAssignmentsPayload(assignmentsRes?.data);

        const publishedForGrading = allAssignments
          .filter((a) => a.status === 'published')
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 8);

        const submissionLists = await Promise.all(
          publishedForGrading.map((a) =>
            teacherApi.getAssignmentSubmissions(a._id).catch(() => null)
          )
        );

        const pending = [];
        submissionLists.forEach((res, idx) => {
          const assignment = publishedForGrading[idx];
          const list = res?.success && Array.isArray(res.data) ? res.data : [];
          list.forEach((sub) => {
            if (sub.status === 'submitted') {
              pending.push({
                ...sub,
                assignmentId: assignment._id,
                assignmentTitle: assignment.title,
                className: assignment.class?.name || '',
              });
            }
          });
        });

        pending.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        const pendingSubmissions = pending.slice(0, 4);

        let announcements = [];
        if (announcementsRes?.success && announcementsRes.data) {
          announcements = Array.isArray(announcementsRes.data)
            ? announcementsRes.data
            : [];
        }
        announcements = [...announcements]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 4);

        setData({
          classes,
          pendingSubmissions,
          recentAnnouncements: announcements,
        });
      } catch (e) {
        console.error('Teacher dashboard load failed:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalClasses = data.classes.length;
  const activeClasses = data.classes.filter((c) => c.status === 'active').length;
  const progressPercent =
    totalClasses > 0 ? Math.round((activeClasses / totalClasses) * 100) : 0;

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 fade-in">
      <section className="col-span-12 relative overflow-hidden rounded-xl p-10 glass-panel shadow-sm border border-outline-variant/30 mb-2">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-primary-container blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <h1 className="text-[3rem] font-bold leading-tight tracking-tight text-on-surface mb-4">
              Chào mừng, {user?.firstName}! <br />
              <span className="text-primary font-headline">Khu vực làm việc của giảng viên.</span>
            </h1>
            <p className="text-on-surface-variant text-lg mb-8 max-w-lg">
              Theo dõi lớp học và bài nộp cần chấm trong cùng một giao diện gọn gàng — tương tự trải nghiệm tổng
              quan của học viên, nhưng dành cho công việc bạn phụ trách.
            </p>
          </div>

          <div className="w-full md:w-80 flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
                Lớp đang hoạt động
              </span>
              <span className="text-3xl font-extrabold text-emerald-500 font-headline">
                {loading ? '...' : `${progressPercent}%`}
              </span>
            </div>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-on-surface-variant">
              {loading ? '—' : `${activeClasses} / ${totalClasses || 0} lớp trạng thái hoạt động`}
            </p>
          </div>
        </div>
      </section>

      <section className="col-span-12 lg:col-span-8 order-1 lg:order-1">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface font-headline">
            Lớp đang giảng dạy
          </h2>
          <NavLink
            to="/teacher/classes"
            className="text-sm font-bold text-primary hover:opacity-80 transition-opacity"
          >
            Xem tất cả
          </NavLink>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
            Đang tải dữ liệu lớp học...
          </div>
        ) : data.classes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
            Bạn chưa được phân công lớp nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.classes.map((cls, idx) => {
              const gradients = [
                'from-[#0037b0] to-[#1d4ed8]',
                'from-[#006a48] to-[#10b981]',
                'from-[#a73400] to-[#f97316]',
                'from-[#4d5b94] to-[#6366f1]',
              ];
              const bgGradient = gradients[idx % gradients.length];
              const levelLabel = LEVEL_LABEL[cls.level] || cls.level || '—';

              return (
                <div
                  key={cls._id}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden whisper-shadow border border-outline-variant/15 flex flex-col group"
                >
                  <div
                    className={`h-32 bg-gradient-to-r ${bgGradient} relative flex items-center justify-center`}
                  >
                    <span className="text-white/80 font-extrabold text-5xl opacity-50 tracking-tighter uppercase">
                      {cls.code || 'CLASS'}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h4 className="text-[1.35rem] font-bold text-on-surface mb-1 font-headline leading-tight group-hover:text-primary transition-colors">
                      {cls.name}
                    </h4>
                    <p className="text-sm text-on-surface-variant mb-6 font-medium font-body flex-1">
                      Trình độ: {levelLabel}
                    </p>

                    <div className="flex justify-between items-center mb-6 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">groups</span>
                        Sức chứa {cls.capacity ?? '—'}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">flag</span>
                        {cls.status === 'active' ? 'Đang học' : cls.status === 'completed' ? 'Đã kết thúc' : cls.status || '—'}
                      </div>
                    </div>

                    <NavLink
                      to={`/teacher/classes/${cls._id}`}
                      className="w-full py-2.5 text-center rounded-lg bg-surface-container-low text-on-surface font-semibold tracking-tight shadow-sm border border-outline-variant/20 hover:bg-primary hover:text-white transition-all"
                    >
                      Vào lớp
                    </NavLink>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8 order-2 lg:order-2">
        <div className="bg-surface-container-lowest rounded-xl p-8 whisper-shadow border border-outline-variant/15">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant font-label">
              Bài nộp chờ chấm
            </h3>
            <NavLink to="/teacher/assignments" className="text-primary text-xs font-bold hover:underline">
              Xem bài tập
            </NavLink>
          </div>

          <div className="flex flex-col gap-5">
            {loading ? (
              <p className="text-slate-500 text-sm">Đang tải...</p>
            ) : data.pendingSubmissions.length === 0 ? (
              <p className="text-slate-500 text-sm">Không có bài nộp trạng thái &quot;Đã nộp&quot; cần chấm.</p>
            ) : (
              data.pendingSubmissions.map((sub) => {
                const name = sub.student
                  ? `${sub.student.firstName || ''} ${sub.student.lastName || ''}`.trim()
                  : 'Học viên';
                return (
                  <NavLink
                    key={sub._id}
                    to={`/teacher/assignments/${sub.assignmentId}`}
                    className="flex justify-between items-start group py-2 border-b border-outline-variant/10 last:border-0"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="font-bold text-on-surface text-sm truncate">{sub.assignmentTitle}</p>
                      <p className="text-[11px] font-semibold text-primary mt-1 truncate bg-primary-fixed/50 inline-block px-2 py-0.5 rounded max-w-full">
                        {name}
                      </p>
                      {sub.className ? (
                        <p className="text-[10px] text-slate-400 truncate mt-1">{sub.className}</p>
                      ) : null}
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px] flex-shrink-0">
                      grading
                    </span>
                  </NavLink>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-8 whisper-shadow border border-outline-variant/15">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant font-label">
              Thông báo gần đây
            </h3>
            <NavLink to="/teacher/announcements" className="text-primary text-xs font-bold hover:underline">
              Tất cả
            </NavLink>
          </div>

          <div className="flex flex-col gap-5">
            {loading ? (
              <p className="text-slate-500 text-sm">Đang tải...</p>
            ) : data.recentAnnouncements.length === 0 ? (
              <p className="text-slate-500 text-sm">Chưa có thông báo nào.</p>
            ) : (
              data.recentAnnouncements.map((ann) => (
                <div
                  key={ann._id}
                  className="flex gap-3 py-2 border-b border-outline-variant/10 last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-container/40 border border-primary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">campaign</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-on-surface text-sm truncate">{ann.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('vi-VN') : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default TeacherDashboard;
