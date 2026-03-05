import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

function TeacherAttendanceList({ navigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    teacherApi.getSessions({})
      .then((res) => { if (res?.success && res.data) setSessions(Array.isArray(res.data.sessions) ? res.data.sessions : res.data || []); })
      .finally(() => setLoading(false));
  }, []);
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');
  return (
    <div className="page-card">
      <h1 className="page-title">Điểm danh</h1>
      <p className="muted">Chọn buổi học để điểm danh.</p>
      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Tiêu đề</th><th>Lớp</th><th>Ngày</th><th>Giờ</th><th></th></tr></thead>
            <tbody>
              {sessions.slice(0, 20).map((s) => (
                <tr key={s._id}>
                  <td>{s.title}</td><td>{s.class?.name}</td><td>{formatDate(s.date)}</td><td>{s.startTime}-{s.endTime}</td>
                  <td><button type="button" className="link" onClick={() => navigate(`/teacher/attendances/${s._id}`)}>Điểm danh</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && <p className="empty">Chưa có buổi học.</p>}
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'Có mặt' },
  { value: 'absent', label: 'Vắng' },
  { value: 'late', label: 'Muộn' },
  { value: 'excused', label: 'Có phép' },
];

export default function TeacherAttendance() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    teacherApi.getSessionAttendance(sessionId)
      .then((res) => {
        if (res?.success && res.data) {
          const arr = Array.isArray(res.data) ? res.data : [];
          setList(arr);
          const init = {};
          arr.forEach((item) => {
            const id = item.student?._id;
            if (id) init[id] = { status: item.status || 'present', notes: item.notes || '' };
          });
          setAttendance(init);
        } else setList([]);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const attendanceList = Object.entries(attendance).map(([studentId, data]) => ({ studentId, ...data }));
    teacherApi.postSessionAttendanceBulk(sessionId, { attendanceList })
      .then((res) => {
        if (res?.success) {
          alert('Điểm danh thành công!');
          navigate('/teacher/attendances');
        } else setError(res?.message || 'Lưu thất bại');
      })
      .catch((err) => setError(err.response?.data?.message || 'Lưu thất bại'))
      .finally(() => setSubmitting(false));
  };

  if (!sessionId) {
    return <TeacherAttendanceList navigate={navigate} />;
  }

  return (
    <div className="page-card">
      <h1 className="page-title">Điểm danh buổi học</h1>
      {error && <p className="error-msg">{error}</p>}
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
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu điểm danh'}
          </button>
        </>
      )}
    </div>
  );
}
