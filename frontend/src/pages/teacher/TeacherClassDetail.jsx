import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
export default function TeacherClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'sessions'

  // Sessions grid (attendance per student)
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceGrid, setAttendanceGrid] = useState(null); // { [studentId]: [{ status, markedAt }, ...] }

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      teacherApi.getClassById(id),
      teacherApi.getClassStudents(id),
      teacherApi.getSessionsByClassId(id)
    ])
      .then(([classRes, studentsRes, sessionsRes]) => {
        if (classRes?.data) setClassInfo(classRes.data);
        if (studentsRes?.data) setStudents(studentsRes.data);
        if (sessionsRes?.data) setSessions(sessionsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const sessionsOrdered = useMemo(() => {
    const getStartAsDate = (s) => {
      const d = s?.date ? new Date(s.date) : null;
      if (!d) return null;
      const t = String(s?.startTime || '00:00').split(':');
      const hh = Number(t[0]) || 0;
      const mm = Number(t[1]) || 0;
      d.setHours(hh, mm, 0, 0);
      return d;
    };

    return [...(sessions || [])].sort((a, b) => {
      const da = getStartAsDate(a);
      const db = getStartAsDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
  }, [sessions]);

  useEffect(() => {
    if (activeTab !== 'sessions') return;
    if (!students?.length || !sessionsOrdered?.length) {
      setAttendanceGrid({});
      return;
    }

    let cancelled = false;
    setAttendanceLoading(true);
    setAttendanceGrid(null);

    const run = async () => {
      try {
        const attendanceResults = await Promise.all(
          sessionsOrdered.map((s) =>
            teacherApi.getSessionAttendance(s._id).catch(() => ({ data: [] }))
          )
        );

        if (cancelled) return;

        const gridByStudent = {};
        students.forEach((st) => {
          gridByStudent[st._id] = Array(sessionsOrdered.length).fill(null).map(() => ({ status: null, markedAt: null }));
        });

        sessionsOrdered.forEach((_, sessionIndex) => {
          const rows = attendanceResults[sessionIndex]?.data || [];
          const byStudentId = new Map();
          rows.forEach((r) => {
            const sid = r?.student?._id;
            if (!sid) return;
            byStudentId.set(sid.toString(), {
              status: r?.status || null,
              markedAt: r?.markedAt || null,
            });
          });

          students.forEach((st) => {
            const sid = st?._id?.toString();
            if (sid && byStudentId.has(sid)) {
              gridByStudent[sid][sessionIndex] = byStudentId.get(sid);
            }
          });
        });

        if (!cancelled) setAttendanceGrid(gridByStudent);
      } catch (e) {
        console.error('Failed to build teacher attendance grid:', e);
        if (!cancelled) setAttendanceGrid({});
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, students, sessionsOrdered]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
            <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">Đang tải dữ liệu lớp học...</p>
        </div>
    );
  }

  if (!classInfo) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl text-error opacity-50">error</span>
            <p className="font-bold text-lg text-error">Không tìm thấy thông tin lớp học.</p>
        </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      {/* Header Back Button & Profile info */}
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => navigate('/teacher/classes')} className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại danh sách
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 lg:p-10 border border-outline-variant/30 shadow-[0_12px_40px_rgba(0,0,0,0.04)] relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                        {classInfo.code}
                    </span>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${classInfo.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-surface-container text-on-surface-variant border border-outline-variant/30'}`}>
                        {classInfo.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline text-on-surface">{classInfo.name}</h1>
                
                <div className="flex flex-wrap gap-6 mt-6">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary/70">event_note</span>
                        <span className="text-sm font-medium">Bắt đầu: <strong className="text-on-surface">{formatDate(classInfo.startDate)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary/70">event_available</span>
                        <span className="text-sm font-medium">Kết thúc: <strong className="text-on-surface">{formatDate(classInfo.endDate)}</strong></span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/20 shadow-inner w-fit mb-6">
        <button 
            className={`py-2 px-6 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'students' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setActiveTab('students')}
        >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Học viên ({students.length})
        </button>
        <button 
            className={`py-2 px-6 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'sessions' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setActiveTab('sessions')}
        >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            Lịch sử điểm danh ({sessions.length})
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden min-h-[400px]">
          {activeTab === 'students' && (
            <div>
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface/50">
                  <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                      Danh sách học viên
                  </h3>
              </div>
              
              {students.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
                      <span className="material-symbols-outlined text-6xl opacity-30">group_off</span>
                      <p className="font-medium">Chưa có sinh viên nào trong lớp.</p>
                  </div>
              ) : (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant">
                                  <th className="p-5 font-bold border-b border-outline-variant/20">Họ và Tên</th>
                                  <th className="p-5 font-bold border-b border-outline-variant/20">Email</th>
                                  <th className="p-5 font-bold border-b border-outline-variant/20">Số điện thoại</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm">
                              {students.map(s => (
                                  <tr key={s._id} className="border-b border-outline-variant/10 hover:bg-surface/50 transition-colors">
                                      <td className="p-5 font-bold text-on-surface flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-primary/20">
                                              {s.firstName?.charAt(0) || 'U'}
                                          </div>
                                          {s.firstName} {s.lastName}
                                      </td>
                                      <td className="p-5 text-on-surface-variant">{s.email}</td>
                                      <td className="p-5 text-on-surface-variant font-medium">{s.phone || s.phoneNumber || '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div>
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface/50">
                  <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                      Lưới điểm danh toàn lớp
                  </h3>
              </div>

              <div className="p-6 teacher-session-grid-wrap">
                {sessionsOrdered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl opacity-30">hourglass_empty</span>
                        <p className="font-medium">Lớp chưa có buổi học nào.</p>
                    </div>
                )}
                {attendanceLoading && (
                  <p className="text-sm text-primary font-bold animate-pulse mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">sync</span>
                    Đang tải điểm danh theo từng buổi...
                  </p>
                )}

                {sessionsOrdered.length > 0 && (
                  <div className="teacher-session-grid-table-wrap border border-outline-variant/30 rounded-xl overflow-hidden">
                    <table className="teacher-session-grid-table">
                      <thead>
                        <tr>
                          <th className="teacher-col-sticky teacher-col-email">Mail</th>
                          <th className="teacher-col-sticky teacher-col-name">Tên</th>
                          <th className="teacher-col-sticky teacher-col-rate">Vắng %</th>
                          {sessionsOrdered.map((_, idx) => (
                            <th key={`s-col-${idx}`} className="teacher-col-session">
                              S{idx + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const nowMs = Date.now();
                          const getStartAsDate = (s) => {
                            const d = s?.date ? new Date(s.date) : null;
                            if (!d) return null;
                            const t = String(s?.startTime || '00:00').split(':');
                            const hh = Number(t[0]) || 0;
                            const mm = Number(t[1]) || 0;
                            d.setHours(hh, mm, 0, 0);
                            return d;
                          };

                          // "Chưa học" = buổi nằm trong tương lai => hiển thị '-'
                          const sessionFutureFlags = sessionsOrdered.map((s) => {
                            const startDate = getStartAsDate(s);
                            return startDate ? startDate.getTime() > nowMs : false;
                          });
                          
                          return students.map((st) => {
                          const sid = st?._id?.toString();
                          const statuses = attendanceGrid?.[sid] || null;
                          const totalAll = sessionsOrdered.length;
                          const absentCount = statuses
                            ? statuses.filter((c) => c?.markedAt && c?.status === 'absent').length
                            : 0;
                          const percent = statuses && totalAll > 0
                            ? Math.round((absentCount / totalAll) * 100)
                            : null;

                          return (
                            <tr key={sid}>
                              <td className="teacher-col-sticky teacher-col-email-cell text-xs">{st.email}</td>
                              <td className="teacher-col-sticky teacher-col-name-cell text-sm">
                                {st.firstName} {st.lastName}
                              </td>
                              <td className="teacher-col-sticky teacher-col-rate-cell">
                                <span className={percent > 20 ? 'text-red-600 font-black' : 'text-on-surface-variant'}>
                                  {percent == null ? '-' : `${percent}%`}
                                </span>
                              </td>
                              {Array(sessionsOrdered.length)
                                .fill(0)
                                .map((_, idx) => {
                                  const cell = statuses ? statuses[idx] : null;
                                  
                                  if (sessionFutureFlags[idx]) {
                                    return (
                                      <td key={`cell-${sid}-${idx}`} className="teacher-att-cell text-outline/30 font-normal">
                                        -
                                      </td>
                                    );
                                  }

                                  if (!cell?.markedAt) {
                                    return (
                                      <td key={`cell-${sid}-${idx}`} className="teacher-att-cell bg-amber-50/50 text-amber-500 font-bold" title="Chưa điểm danh">
                                        ?
                                      </td>
                                    );
                                  }

                                  const cellText = cell.status === 'present' ? 'P' : 'A';
                                  const cellClass = cell.status === 'present' ? 'present bg-emerald-50/50' : 'absent bg-red-50/50';
                                  
                                  return (
                                    <td key={`cell-${sid}-${idx}`} className={`teacher-att-cell ${cellClass}`}>
                                      {cellText}
                                    </td>
                                  );
                                })}
                            </tr>
                          );
                        });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
