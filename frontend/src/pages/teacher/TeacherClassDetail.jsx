import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import './TeacherClassDetail.css';

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
  const [attendanceGrid, setAttendanceGrid] = useState(null); // { [studentId]: ['present'|'absent', ...] }

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
          gridByStudent[st._id] = Array(sessionsOrdered.length).fill('absent');
        });

        sessionsOrdered.forEach((_, sessionIndex) => {
          const rows = attendanceResults[sessionIndex]?.data || [];
          const statusByStudentId = new Map();
          rows.forEach((r) => {
            const sid = r?.student?._id;
            if (!sid) return;
            statusByStudentId.set(sid.toString(), r?.status || 'absent');
          });

          students.forEach((st) => {
            const sid = st?._id?.toString();
            if (sid && statusByStudentId.has(sid)) {
              gridByStudent[sid][sessionIndex] = statusByStudentId.get(sid);
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
    return <div className="page-card"><p>Đang tải dữ liệu lớp học...</p></div>;
  }

  if (!classInfo) {
    return <div className="page-card"><p className="error-msg">Không tìm thấy thông tin lớp học.</p></div>;
  }

  return (
    <div className="page-card">
      <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
         <button className="btn-secondary" onClick={() => navigate('/teacher/classes')}>
            ← Quay lại
         </button>
         <h1 className="page-title" style={{ margin: 0 }}>
            {classInfo.name} <span style={{ fontSize: '1rem', color: '#64748b' }}>({classInfo.code})</span>
         </h1>
      </div>

      <div className="toolbar" style={{ marginBottom: '20px' }}>
        <button 
          type="button" 
          className={activeTab === 'students' ? 'active' : ''} 
          onClick={() => setActiveTab('students')}
        >
          Danh sách Sinh viên ({students.length})
        </button>
        <button 
          type="button" 
          className={activeTab === 'sessions' ? 'active' : ''} 
          onClick={() => setActiveTab('sessions')}
        >
          Lịch trình ({sessions.length})
        </button>
      </div>

      {activeTab === 'students' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Email</th>
                <th>SĐT</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id}>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.email}</td>
                  <td>{s.phone || s.phoneNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <p className="empty">Chưa có sinh viên nào trong lớp.</p>}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="teacher-session-grid-wrap">
          {sessionsOrdered.length === 0 && <p className="empty">Lớp chưa có buổi học nào.</p>}
          {attendanceLoading && (
            <p className="muted" style={{ margin: '0 0 12px' }}>
              Đang tải điểm danh theo từng buổi...
            </p>
          )}

          {sessionsOrdered.length > 0 && (
            <div className="teacher-session-grid-table-wrap">
              <table className="teacher-session-grid-table">
                <thead>
                  <tr>
                    <th className="teacher-col-sticky teacher-col-email">Mail</th>
                    <th className="teacher-col-sticky teacher-col-name">Tên</th>
                    <th className="teacher-col-sticky teacher-col-rate">tình trạng điểm danh</th>
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
                    const startedIndices = sessionFutureFlags
                      .map((isFuture, idx) => (!isFuture ? idx : -1))
                      .filter((x) => x !== -1);

                    return students.map((st) => {
                    const sid = st?._id?.toString();
                    const statuses = attendanceGrid?.[sid] || null;
                    const totalStarted = startedIndices.length;
                    const absentCount = statuses
                      ? startedIndices.filter((idx) => statuses[idx] === 'absent').length
                      : 0;
                    // % điểm danh = nghỉ/vắng / tổng số buổi học đã diễn ra
                    const percent = statuses && totalStarted > 0
                      ? Math.round((absentCount / totalStarted) * 100)
                      : null;

                    return (
                      <tr key={sid}>
                        <td className="teacher-col-sticky teacher-col-email-cell">{st.email}</td>
                        <td className="teacher-col-sticky teacher-col-name-cell">
                          {st.firstName} {st.lastName}
                        </td>
                        <td className="teacher-col-sticky teacher-col-rate-cell">
                          {percent == null ? '-' : `${percent}%`}
                        </td>
                        {Array(sessionsOrdered.length)
                          .fill(0)
                          .map((_, idx) => {
                            const status = statuses ? statuses[idx] : null;
                            // Buổi tương lai: chưa học => '-'
                            if (sessionFutureFlags[idx]) {
                              return (
                                <td key={`cell-${sid}-${idx}`} className="teacher-att-cell">
                                  -
                                </td>
                              );
                            }

                            const cellText = status === 'present' ? 'p' : 'a';
                            const cellClass =
                              status === 'present' ? 'present' : 'absent';
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

          {students.length === 0 && <p className="empty">Chưa có sinh viên nào trong lớp.</p>}
        </div>
      )}
    </div>
  );
}
