import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../api/teacherApi';
import { Link } from 'react-router-dom';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

export default function TeacherSessions() {
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    teacherApi.getClasses()
      .then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : res.data.classes || []); })
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    teacherApi.getSessions(classId ? { classId } : {})
      .then((res) => {
        if (res?.success && res.data) {
          const list = res.data.sessions || res.data;
          setSessions(Array.isArray(list) ? list : []);
        } else setSessions([]);
      })
      .catch((err) => { setError(err.response?.data?.message || 'Tải danh sách thất bại'); setSessions([]); })
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <div className="page-card">
      <h1 className="page-title">Buổi học</h1>
      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="form-select">
          <option value="">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Lớp</th>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Phòng</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id}>
                  <td>{s.title}</td>
                  <td>{s.class?.name || '-'}</td>
                  <td>{formatDate(s.date)}</td>
                  <td>{s.startTime} - {s.endTime}</td>
                  <td>{s.room || '-'}</td>
                  <td>{s.status || '-'}</td>
                  <td>
                    <Link to={`/teacher/attendances/${s._id}`} className="link">Điểm danh</Link>
                  </td>
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
