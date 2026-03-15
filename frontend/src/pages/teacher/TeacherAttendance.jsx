import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

// First Level: List of classes taught by the teacher
function TeacherAttendanceClassList({ navigate }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getMyClasses()
      .then((res) => {
        if (res?.success && res.data) setClasses(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-card">
      <h1 className="page-title">Điểm danh</h1>
      <p className="muted">Chọn lớp học để bắt đầu điểm danh.</p>
      
      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Lớp</th>
                <th>Tên Lớp</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c._id}>
                  <td>{c.code}</td>
                  <td>{c.name}</td>
                  <td>
                    <span className={`status-badge ${c.status === 'active' ? 'active' : 'inactive'}`}>
                      {c.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="link" 
                      onClick={() => navigate(`/teacher/attendances/class/${c._id}`)}
                    >
                      Xem lịch học
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {classes.length === 0 && <p className="empty">Bạn chưa được phân công giảng dạy lớp nào.</p>}
        </div>
      )}
    </div>
  );
}

// Second Level: List of sessions for a selected class
function TeacherClassSessions({ classId, navigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getSessionsByClassId(classId)
      .then((res) => {
        if (res?.success && res.data) setSessions(res.data);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getAttendanceStatus = (sessionDate, sessionTime) => {
    if (!sessionDate || !sessionTime) return { canEdit: false, label: 'N/A' };
    
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const dStr = sessionDate instanceof Date ? sessionDate.toISOString().split('T')[0] : String(sessionDate).split('T')[0];
    const parts = dStr.split('-');
    const sessionStart = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), hours, minutes, 0, 0)
      : new Date(sessionDate);

    if (parts.length !== 3) {
      sessionStart.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const diffMs = now.getTime() - sessionStart.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { canEdit: false, label: 'Chưa mở', class: 'inactive' };
    }
    if (diffHours > 24) {
      return { canEdit: false, label: 'Đã khóa', class: 'completed' };
    }
    return { canEdit: true, label: 'Sẵn sàng', class: 'active' };
  };

  return (
    <div className="page-card">
      <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
         <button className="btn-secondary" onClick={() => navigate('/teacher/attendances')}>
            ← Lớp học
         </button>
         <h1 className="page-title" style={{ margin: 0 }}>Danh sách buổi học</h1>
      </div>

      <p className="muted">Chọn buổi học để điểm danh. Chỉ được phép điểm danh trong vòng 24h kể từ khi bắt đầu.</p>

      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Trạng thái Cổng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const status = getAttendanceStatus(s.date, s.startTime);
                return (
                  <tr key={s._id}>
                    <td>{s.title}</td>
                    <td>{formatDate(s.date)}</td>
                    <td>{s.startTime}-{s.endTime}</td>
                    <td>
                      <span className={`status-badge ${status.class}`}>{status.label}</span>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="link" 
                        onClick={() => navigate(`/teacher/attendances/session/${s._id}`)}
                      >
                        {status.canEdit ? 'Điểm danh' : 'Xem báo cáo'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sessions.length === 0 && <p className="empty">Chưa có lịch học nào.</p>}
        </div>
      )}
    </div>
  );
}

// Third Level: Marking attendance
const STATUS_OPTIONS = [
  { value: 'present', label: 'Có mặt' },
  { value: 'absent', label: 'Vắng' },
  { value: 'late', label: 'Muộn' },
  { value: 'excused', label: 'Có phép' },
];

export default function TeacherAttendance() {
  const { classId, sessionId } = useParams();
  const navigate = useNavigate();
  
  const [list, setList] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [sessionDetail, setSessionDetail] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // sessionId processing hook must be called unconditionally before early returns
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);

    Promise.all([
      teacherApi.getSessionById(sessionId).catch(() => null),
      teacherApi.getSessionAttendance(sessionId).catch(() => null)
    ])
      .then(([sessionRes, attendanceRes]) => {
        if (sessionRes?.data) setSessionDetail(sessionRes.data);
        
        if (attendanceRes?.success && attendanceRes.data) {
          const arr = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
          setList(arr);
          const init = {};
          arr.forEach((item) => {
            const id = item.student?._id;
            if (id) init[id] = { status: item.status || 'present', notes: item.notes || '' };
          });
          setAttendance(init);
        } else {
          setList([]);
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Level Routing - Render matching sub-pages
  if (!classId && !sessionId) return <TeacherAttendanceClassList navigate={navigate} />;
  if (classId && !sessionId) return <TeacherClassSessions classId={classId} navigate={navigate} />;

  const getAttendanceStatus = (sessionDate, sessionTime) => {
    if (!sessionDate || !sessionTime) return false;
    
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const dStr = sessionDate instanceof Date ? sessionDate.toISOString().split('T')[0] : String(sessionDate).split('T')[0];
    const parts = dStr.split('-');
    const sessionStart = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), hours, minutes, 0, 0)
      : new Date(sessionDate);

    if (parts.length !== 3) {
      sessionStart.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const diffMs = now.getTime() - sessionStart.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= 0 && diffHours <= 24;
  };

  const isEditable = sessionDetail ? getAttendanceStatus(sessionDetail.date, sessionDetail.startTime) : false;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const attendanceList = Object.entries(attendance).map(([studentId, data]) => ({ studentId, ...data }));
    teacherApi.postSessionAttendanceBulk(sessionId, { attendanceList })
      .then((res) => {
        if (res?.success) {
          alert('Điểm danh thành công!');
          if (sessionDetail?.class?._id || sessionDetail?.class) {
             const clsId = sessionDetail.class._id || sessionDetail.class;
             navigate(`/teacher/attendances/class/${clsId}`);
          } else {
             navigate('/teacher/attendances');
          }
        } else setError(res?.message || 'Lưu thất bại');
      })
      .catch((err) => setError(err.response?.data?.message || 'Lưu thất bại'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="page-card">
      <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
         <button className="btn-secondary" onClick={() => {
            if (sessionDetail?.class?._id || sessionDetail?.class) {
               const clsId = sessionDetail.class._id || sessionDetail.class;
               navigate(`/teacher/attendances/class/${clsId}`);
            } else {
               navigate('/teacher/attendances');
            }
         }}>
            ← Danh sách buổi học
         </button>
         <h1 className="page-title" style={{ margin: 0 }}>Điểm danh: {sessionDetail?.title || sessionId}</h1>
      </div>

      {error && <p className="error-msg">{error}</p>}
      
      {!isEditable && !loading && sessionDetail && (
         <div className="error-alert" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde047' }}>
            <strong>Chế độ Xem (Read-only):</strong> Mốc thời gian điểm danh 24 giờ đã hết hoặc chưa mở. Bạn không thể thay đổi thông tin.
         </div>
      )}

      {loading ? <p>Đang tải...</p> : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Học sinh</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => {
                  const id = item.student?._id;
                  if (!id) return null;
                  return (
                    <tr key={id}>
                      <td>{item.student.firstName} {item.student.lastName}</td>
                      <td>
                        <select
                          className="form-select"
                          value={attendance[id]?.status || 'present'}
                          onChange={(e) => setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], status: e.target.value } }))}
                          disabled={!isEditable}
                          style={!isEditable ? { backgroundColor: '#f1f5f9', opacity: 0.8 } : {}}
                        >
                          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ghi chú..."
                          value={attendance[id]?.notes || ''}
                          onChange={(e) => setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], notes: e.target.value } }))}
                          disabled={!isEditable}
                          style={!isEditable ? { backgroundColor: '#f1f5f9', opacity: 0.8 } : {}}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isEditable && (
             <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ marginTop: '16px' }}>
               {submitting ? 'Đang lưu...' : 'Lưu điểm danh'}
             </button>
          )}
        </>
      )}
    </div>
  );
}
