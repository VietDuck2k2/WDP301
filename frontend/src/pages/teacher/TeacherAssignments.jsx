import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import FileUpload from '../../components/FileUpload';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class: '', title: '', description: '', instructions: '', dueDate: '', maxScore: 100, attachments: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    teacherApi.getClasses()
      .then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); })
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    teacherApi.getAssignments(classId ? { classId } : {})
      .then((res) => {
        if (res?.success && res.data) {
          const list = res.data.assignments || res.data;
          setAssignments(Array.isArray(list) ? list : []);
        } else setAssignments([]);
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [classId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    teacherApi.createAssignment({
      class: form.class,
      title: form.title,
      description: form.description,
      instructions: form.instructions,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      maxScore: Number(form.maxScore) || 100,
      attachments: form.attachments,
    })
      .then((res) => {
        if (res?.success) { setShowForm(false); setForm({ class: '', title: '', description: '', instructions: '', dueDate: '', maxScore: 100, attachments: [] }); setAssignments((prev) => [res.data, ...prev]); }
        else setError(res?.message || 'Tạo thất bại');
      })
      .catch((err) => setError(err.response?.data?.message || 'Tạo thất bại'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Bài tập</h1>
      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="form-select">
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>Tạo bài tập</button>
      </div>
      {error && <p className="error-msg">{error}</p>}
      {showForm && (
        <form onSubmit={handleCreate} className="form-card">
          <h3>Tạo bài tập mới</h3>
          <select required value={form.class} onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))} className="form-select">
            <option value="">Chọn lớp</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input required placeholder="Tiêu đề" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="form-input" />
          <textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="form-input" />
          <input placeholder="Hướng dẫn nộp bài" value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="form-input" />
          <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="form-input" />
          <input type="number" min="0" placeholder="Điểm tối đa" value={form.maxScore} onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))} className="form-input" />
          <FileUpload value={form.attachments} onChange={(att) => setForm((f) => ({ ...f, attachments: att }))} label="Tệp đính kèm" />
          <div>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Đang tạo...' : 'Tạo'}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
          </div>
        </form>
      )}
      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Tiêu đề</th><th>Lớp</th><th>Hạn nộp</th><th>Điểm</th><th>Trạng thái</th><th></th></tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id}>
                  <td>{a.title}</td>
                  <td>{a.class?.name}</td>
                  <td>{formatDate(a.dueDate)}</td>
                  <td>{a.maxScore}</td>
                  <td>{a.status || '-'}</td>
                  <td><Link to={`/teacher/assignments/${a._id}`} className="link">Xem / Chấm bài</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignments.length === 0 && <p className="empty">Chưa có bài tập.</p>}
        </div>
      )}
    </div>
  );
}
