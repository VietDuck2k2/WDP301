import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');
const PRIORITY_LABEL = { low: 'Thấp', normal: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' };

export default function StudentAnnouncements() {
  const { classId } = useParams();
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(classId || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getClasses().then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); });
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setList([]); setLoading(false); return; }
    setLoading(true);
    studentApi.getClassAnnouncements(selectedClassId)
      .then((res) => { if (res?.success && res.data) setList(Array.isArray(res.data) ? res.data : []); })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  return (
    <div className="page-card">
      <h1 className="page-title">Thông báo</h1>
      <div className="toolbar">
        <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="form-select">
          <option value="">Chọn lớp</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      {!selectedClassId && <p className="muted">Chọn lớp để xem thông báo.</p>}
      {loading ? <p>Đang tải...</p> : (
        <div className="list-card">
          {list.map((a) => (
            <div key={a._id} className="card-item">
              <span className="badge">{PRIORITY_LABEL[a.priority] || a.priority}</span>
              {a.isPinned && <span className="badge pin">Ghim</span>}
              <h3>{a.title}</h3>
              <p>{a.content}</p>
              <p className="muted">GV: {a.createdBy?.firstName} {a.createdBy?.lastName} · {formatDate(a.createdAt)}</p>
            </div>
          ))}
          {list.length === 0 && selectedClassId && <p className="empty">Chưa có thông báo.</p>}
        </div>
      )}
    </div>
  );
}
