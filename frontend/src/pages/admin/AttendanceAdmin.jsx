import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import './AttendanceAdmin.css';

const statusOptions = [
  { value: 'present', label: 'Có mặt' },
  { value: 'absent', label: 'Vắng' },
  { value: 'late', label: 'Muộn' },
  { value: 'excused', label: 'Có phép' },
];

const AttendanceAdmin = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState('');

  // Fetch classes on load
  useEffect(() => {
    adminApi.getClasses({ limit: 200 }).then(res => {
      if (res?.success) setClasses(res.data?.classes || []);
    }).catch(() => {});
  }, []);

  // Fetch sessions when classId changes
  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    adminApi.getSessionsByClassId(classId)
      .then(res => {
        if (res?.success) setSessions(res.data || []);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  const openSessionDetail = async (session) => {
    setSessionDetail(session);
    setDetailLoading(true);
    try {
      // In Admin mode, we want the FULL student list for that class, merged with attendance records
      const attendanceRes = await adminApi.getSessionAttendance(session._id);
      
      if (attendanceRes?.success) {
         setDetailRows(attendanceRes.data || []);
      }
    } catch (error) {
      console.error('Failed to get session attendance detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleInlineStatusChange = async (studentId, nextStatus) => {
    const target = detailRows.find((r) => r.student?._id === studentId);
    if (!target) return;

    const prevStatus = target.status;
    
    // Optimistic update
    setDetailRows(prev => prev.map(r => r.student?._id === studentId ? { ...r, status: nextStatus } : r));

    setSavingStudentId(studentId);
    try {
      // If student already has attendanceId, update it. 
      // If not, we might need a "bulk update" or "create record" logic.
      // Based on our controllers, adminApi.updateAttendance usually takes recordId.
      // If record doesn't exist, we send a bulk update for the session.
      
      const payload = {
         attendanceList: detailRows.map(r => ({
            studentId: r.student._id,
            status: r.student._id === studentId ? nextStatus : (r.status || 'present'),
            notes: r.notes || ''
         }))
      };

      // Since updateAttendance is usually for single records, for Admin we'll leverage the Teacher bulk API logic or similar if available for Admin
      // However, usually center systems let Admin edit the session's overall attendance.
      // Assuming existing backend 'updateAttendance' updates specific record.
      
      if (target._id) {
         await adminApi.updateAttendance(target._id, { status: nextStatus });
      } else {
         // Create a bulk update context if this record isn't initially created (same behavior as teacher)
         await adminApi.postSessionAttendanceBulk(sessionDetail._id, payload);
      }
    } catch (error) {
      setDetailRows(prev => prev.map(r => r.student?._id === studentId ? { ...r, status: prevStatus } : r));
      alert(error?.response?.data?.message || 'Update failed');
    } finally {
      setSavingStudentId('');
    }
  };

  const isToday = (dateStr) => {
     if (!dateStr) return false;
     const d = new Date(dateStr);
     const today = new Date();
     return d.getDate() === today.getDate() && 
            d.getMonth() === today.getMonth() && 
            d.getFullYear() === today.getFullYear();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (!classId) {
     return (
        <div className="admin-attendance-page">
           <section className="admin-attendance-header">
              <h1>Quản lý Điểm danh</h1>
              <p>Chọn một lớp học để xem và điều chỉnh điểm danh của các buổi học.</p>
           </section>
           <section className="admin-attendance-panel">
              <div className="class-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                 {classes.map(c => (
                    <div key={c._id} className="class-card clickable" onClick={() => navigate(`/admin/attendance/class/${c._id}`)}>
                       <div className="class-card-header">
                          <h3>{c.name}</h3>
                          <span className="code">{c.code}</span>
                       </div>
                       <div className="class-card-body">
                          <p>Trạng thái: <span className={`status-badge ${c.status}`}>{c.status === 'active' ? 'Hoạt động' : 'Đã đóng'}</span></p>
                       </div>
                    </div>
                 ))}
              </div>
              {classes.length === 0 && <p className="empty-msg">Chưa có lớp học nào.</p>}
           </section>
        </div>
     );
  }

  return (
    <div className="admin-attendance-page">
      <section className="admin-attendance-header">
         <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn-secondary" onClick={() => navigate('/admin/attendance')}>← Quay lại</button>
            <h1>Danh sách Buổi học</h1>
         </div>
      </section>

      <section className="admin-attendance-panel">
        {loading ? <p>Đang tải buổi học...</p> : (
            <div className="table-wrapper">
            <table>
                <thead>
                <tr>
                    <th>Buổi học</th>
                    <th>Ngày</th>
                    <th>Giờ</th>
                    <th>Phòng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
                {sessions.map((s) => (
                    <tr key={s._id} className={isToday(s.date) ? 'row-today' : ''}>
                    <td>
                        {s.title}
                        {isToday(s.date) && <span className="today-badge">HÔM NAY</span>}
                    </td>
                    <td>{formatDate(s.date)}</td>
                    <td>{s.startTime} - {s.endTime}</td>
                    <td>{s.room?.name || s.room || '-'}</td>
                    <td>
                        <span className={`status-badge ${s.status || 'upcoming'}`}>
                            {s.status === 'completed' ? 'Hoàn thành' : 'Sắp tới'}
                        </span>
                    </td>
                    <td>
                        <button className="btn-primary-sm" onClick={() => openSessionDetail(s)}>
                             Điểm danh / Sửa
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {sessions.length === 0 && <p className="empty-row">Lớp này chưa có buổi học nào.</p>}
            </div>
        )}
      </section>

      {sessionDetail && (
        <div className="modal-overlay" role="presentation" onClick={() => setSessionDetail(null)}>
          <div className="modal-card wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{sessionDetail.title} — Danh sách Điểm danh</h2>
            <div className="modal-meta">
               <span>Ngày: {formatDate(sessionDetail.date)}</span>
               <span>Giờ: {sessionDetail.startTime}-{sessionDetail.endTime}</span>
            </div>

            <div className="table-wrapper">
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Sinh viên</th>
                    <th>Số điện thoại</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {detailLoading ? (
                    <tr><td colSpan="4">Đang tải danh sách...</td></tr>
                  ) : detailRows.map((row) => (
                    <tr key={row.student?._id}>
                      <td>
                         <div className="student-info">
                            <strong>{row.student?.firstName} {row.student?.lastName}</strong>
                            <span className="student-code">{row.student?.code}</span>
                         </div>
                      </td>
                      <td>{row.student?.phoneNumber || '-'}</td>
                      <td>
                        <select
                          className="inline-status-select"
                          value={row.status || 'absent'}
                          disabled={savingStudentId === row.student?._id}
                          onChange={(e) => handleInlineStatusChange(row.student?._id, e.target.value)}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>{row.notes || '-'}</td>
                    </tr>
                  ))}
                  {!detailLoading && detailRows.length === 0 && (
                     <tr><td colSpan="4" className="empty-row">Không tìm thấy sinh viên nào trong buổi học này.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setSessionDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceAdmin;
