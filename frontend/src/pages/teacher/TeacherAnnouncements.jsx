import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../api/teacherApi';
import FileUpload from '../../components/FileUpload';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');
const PRIORITY_LABEL = { low: 'Thấp', normal: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' };

export default function TeacherAnnouncements() {
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class: '', title: '', content: '', priority: 'normal', attachments: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    teacherApi.getMyClasses().then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    teacherApi.getAnnouncements()
      .then((res) => { if (res?.success && res.data) setList(Array.isArray(res.data) ? res.data : []); })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    teacherApi.createAnnouncement({ class: form.class, title: form.title, content: form.content, priority: form.priority, attachments: form.attachments })
      .then((res) => {
        if (res?.success) { setShowForm(false); setForm({ class: '', title: '', content: '', priority: 'normal', attachments: [] }); setList((prev) => [res.data, ...prev]); }
        else setError(res?.message || 'Tạo thất bại');
      })
      .catch((err) => setError(err.response?.data?.message || 'Tạo thất bại'))
      .finally(() => setSubmitting(false));
  };

  const togglePin = (id) => {
    teacherApi.toggleAnnouncementPin(id).then((res) => { if (res?.success && res.data) setList((prev) => prev.map((a) => (a._id === id ? res.data : a))); });
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Thông báo</h1>
      <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>Tạo thông báo</button>
      {showForm && (
        <form onSubmit={handleCreate} className="form-card">
          <h3>Tạo thông báo</h3>
          <select required value={form.class} onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))} className="form-select">
            <option value="">Chọn lớp</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input required placeholder="Tiêu đề" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="form-input" />
          <textarea placeholder="Nội dung" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="form-input" />
          <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="form-select">
            {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <FileUpload value={form.attachments} onChange={(att) => setForm((f) => ({ ...f, attachments: att }))} />
          <div><button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo'}</button><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button></div>
        </form>
      )}
      {error && <p className="error-msg">{error}</p>}
      {loading ? <p>Đang tải...</p> : (
        <div className="list-card">
          {list.map((a) => (
            <div key={a._id} className="card-item">
              <span className="badge">{PRIORITY_LABEL[a.priority] || a.priority}</span>
              {a.isPinned && <span className="badge pin">Ghim</span>}
              <h3>{a.title}</h3>
              <p>{a.content}</p>
              <p className="muted">Lớp: {a.class?.name} · {formatDate(a.createdAt)}</p>
              <button type="button" className="link" onClick={() => togglePin(a._id)}>Bật/tắt ghim</button>
            </div>
          ))}
          {list.length === 0 && <p className="empty">Chưa có thông báo.</p>}
        </div>
      )}
    </div>
  );
}
