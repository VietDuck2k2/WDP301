import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import FileUpload from '../../components/FileUpload';
import '../../pages/PageCommon.css';

export default function TeacherAssignments() {
   const [classes, setClasses] = useState([]);
   const [assignments, setAssignments] = useState([]);
   const [classId, setClassId] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');
   const [showForm, setShowForm] = useState(false);
   const [form, setForm] = useState({
      class: '',
      title: '',
      description: '',
      instructions: '',
      dueDate: '',
      maxScore: 100,
      attachments: [],
   });

   useEffect(() => {
      teacherApi.getMyClasses().then((res) => {
         if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []);
      }).catch(() => setClasses([]));
   }, []);

   useEffect(() => {
      setLoading(true);
      teacherApi
         .getAssignments(classId ? { classId } : {})
         .then((res) => {
            const data = res?.data;
            const list = data?.assignments ?? (Array.isArray(data) ? data : []);
            setAssignments(list);
         })
         .catch(() => setAssignments([]))
         .finally(() => setLoading(false));
   }, [classId]);

   const handleCreate = async (e) => {
      e.preventDefault();
      setError('');
      if (!form.class || !form.title || !form.dueDate) {
         setError('Vui lòng điền lớp, tiêu đề và hạn nộp.');
         return;
      }
      setLoading(true);
      try {
         const res = await teacherApi.createAssignment({
            class: form.class,
            title: form.title,
            description: form.description || '',
            instructions: form.instructions || '',
            dueDate: new Date(form.dueDate).toISOString(),
            maxScore: Number(form.maxScore) || 100,
            attachments: form.attachments || [],
         });
         if (res?.success) {
            setShowForm(false);
            setForm({ class: '', title: '', description: '', instructions: '', dueDate: '', maxScore: 100, attachments: [] });
            setAssignments((prev) => [res.data, ...prev]);
         } else setError(res?.message || 'Tạo thất bại.');
      } catch (_) {
         setError('Tạo bài tập thất bại.');
      }
      setLoading(false);
   };

   const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Bài tập</h1>
         <div className="page-common-toolbar">
            <label>
               Lớp:
               <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="page-common-select"
               >
                  <option value="">Tất cả</option>
                  {classes.map((c) => (
                     <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
               </select>
            </label>
            <button type="button" className="page-common-btn page-common-btn-primary" onClick={() => setShowForm(true)}>
               + Tạo bài tập
            </button>
         </div>

         {showForm && (
            <div className="page-common-card" style={{ marginBottom: 24 }}>
               <h2 style={{ marginTop: 0 }}>Tạo bài tập mới</h2>
               <form onSubmit={handleCreate}>
                  {error && <p className="page-common-error">{error}</p>}
                  <div style={{ marginBottom: 12 }}>
                     <label>Lớp *</label>
                     <select
                        value={form.class}
                        onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                        className="page-common-select"
                        required
                     >
                        <option value="">-- Chọn lớp --</option>
                        {classes.map((c) => (
                           <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                     </select>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                     <label>Tiêu đề *</label>
                     <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        className="page-common-input"
                        style={{ maxWidth: '100%' }}
                        required
                     />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                     <label>Mô tả</label>
                     <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className="page-common-input"
                        rows={3}
                        style={{ maxWidth: '100%' }}
                     />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                     <label>Hướng dẫn</label>
                     <input
                        type="text"
                        value={form.instructions}
                        onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                        className="page-common-input"
                        style={{ maxWidth: '100%' }}
                     />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                     <label>Hạn nộp *</label>
                     <input
                        type="datetime-local"
                        value={form.dueDate}
                        onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                        className="page-common-input"
                        required
                     />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                     <label>Điểm tối đa</label>
                     <input
                        type="number"
                        value={form.maxScore}
                        onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
                        className="page-common-input"
                        min={1}
                     />
                  </div>
                  <FileUpload
                     value={form.attachments}
                     onChange={(attachments) => setForm((f) => ({ ...f, attachments }))}
                     label="Tệp đính kèm"
                  />
                  <div className="page-common-toolbar" style={{ marginTop: 16 }}>
                     <button type="submit" className="page-common-btn page-common-btn-primary" disabled={loading}>
                        Tạo
                     </button>
                     <button type="button" className="page-common-btn" onClick={() => setShowForm(false)}>
                        Hủy
                     </button>
                  </div>
               </form>
            </div>
         )}

         {loading && <p className="page-common-loading">Đang tải...</p>}
         {!loading && assignments.length === 0 && <p className="page-common-empty">Chưa có bài tập.</p>}
         {!loading && assignments.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Tiêu đề</th>
                        <th>Lớp</th>
                        <th>Hạn nộp</th>
                        <th>Điểm</th>
                        <th>Trạng thái</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {assignments.map((a) => (
                        <tr key={a._id}>
                           <td>{a.title}</td>
                           <td>{a.class?.name || '-'}</td>
                           <td>{formatDate(a.dueDate)}</td>
                           <td>{a.maxScore ?? '-'}</td>
                           <td>{a.status || 'draft'}</td>
                           <td>
                              <Link to={`/teacher/assignments/${a._id}`} className="page-common-link">
                                 Xem / Chấm
                              </Link>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
