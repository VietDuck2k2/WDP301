import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getClasses()
      .then((res) => {
        if (res?.success && res.data) {
          // Backend returns { classes: [...], pagination: {...} }
          const list = res.data.classes ?? (Array.isArray(res.data) ? res.data : []);
          setClasses(list);
        }
      })
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-card">
      <h1 className="page-title">Lớp học của tôi</h1>
      {loading ? <p>Đang tải...</p> : (
        <div className="card-grid">
          {classes.map((c) => (
            <div key={c._id} className="card-item">
              <h3>{c.name}</h3>
              <p className="muted">Mã: {c.code} · {c.room}</p>
              <p>Khai giảng: {formatDate(c.startDate)} · Kết thúc: {formatDate(c.endDate)}</p>
              <Link to={`/student/assignments?classId=${c._id}`} className="link">Xem bài tập</Link>
              <Link to={`/student/announcements/${c._id}`} className="link">Thông báo</Link>
            </div>
          ))}
          {classes.length === 0 && <p className="empty">Chưa đăng ký lớp nào.</p>}
        </div>
      )}
    </div>
  );
}
