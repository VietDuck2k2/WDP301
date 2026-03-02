import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import FileUpload from '../../components/FileUpload';
import '../../pages/PageCommon.css';

export default function AssignmentSubmit() {
   const { id } = useParams();
   const navigate = useNavigate();
   const [assignment, setAssignment] = useState(null);
   const [existing, setExisting] = useState(null);
   const [loading, setLoading] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState('');
   const [form, setForm] = useState({ content: '', attachments: [] });

   useEffect(() => {
      if (!id) return;
      setLoading(true);
      Promise.all([
         studentApi.getAssignmentById(id),
         studentApi.getMySubmissionForAssignment(id),
      ])
         .then(([aRes, sRes]) => {
            if (aRes?.success && aRes.data) setAssignment(aRes.data);
            if (sRes?.success && sRes.data) setExisting(sRes.data);
         })
         .catch(() => setError('Không tải được dữ liệu.'))
         .finally(() => setLoading(false));
   }, [id]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSubmitting(true);
      try {
         const res = await studentApi.submitAssignment(id, {
            content: form.content,
            attachments: form.attachments,
         });
         if (res?.success) {
            setExisting(res.data);
            alert('Nộp bài thành công!');
         } else setError(res?.message || 'Nộp bài thất bại.');
      } catch (_) {
         setError('Nộp bài thất bại.');
      }
      setSubmitting(false);
   };

   if (loading) return <div className="page-common"><p className="page-common-loading">Đang tải...</p></div>;
   if (error && !assignment) {
      return (
         <div className="page-common">
            <p className="page-common-error">{error}</p>
            <button type="button" className="page-common-btn" onClick={() => navigate('/student/assignments')}>
               Quay lại
            </button>
         </div>
      );
   }

   const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

   if (existing?.status === 'submitted' || existing?.status === 'graded') {
      return (
         <div className="page-common">
            <h1 className="page-common-title">{assignment?.title}</h1>
            <div className="page-common-card">
               <p>Bạn đã nộp bài lúc {formatDate(existing.submittedAt)}.</p>
               {existing.status === 'graded' && (
                  <p><strong>Điểm:</strong> {existing.score} / {assignment?.maxScore}. {existing.feedback && `Nhận xét: ${existing.feedback}`}</p>
               )}
            </div>
            <button type="button" className="page-common-btn" onClick={() => navigate('/student/assignments')}>
               Quay lại
            </button>
         </div>
      );
   }

   return (
      <div className="page-common">
         <h1 className="page-common-title">Nộp bài: {assignment?.title}</h1>
         <div className="page-common-card" style={{ marginBottom: 24 }}>
            <p><strong>Hạn nộp:</strong> {formatDate(assignment?.dueDate)}</p>
            {assignment?.description && <p>{assignment.description}</p>}
         </div>
         <div className="page-common-card">
            <form onSubmit={handleSubmit}>
               {error && <p className="page-common-error">{error}</p>}
               <div style={{ marginBottom: 12 }}>
                  <label>Nội dung / Ghi chú</label>
                  <textarea
                     value={form.content}
                     onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                     className="page-common-input"
                     rows={5}
                     style={{ maxWidth: '100%' }}
                  />
               </div>
               <FileUpload
                  value={form.attachments}
                  onChange={(attachments) => setForm((f) => ({ ...f, attachments }))}
                  label="Tệp đính kèm"
               />
               <div className="page-common-toolbar" style={{ marginTop: 16 }}>
                  <button type="submit" className="page-common-btn page-common-btn-primary" disabled={submitting}>
                     {submitting ? 'Đang nộp...' : 'Nộp bài'}
                  </button>
                  <button type="button" className="page-common-btn" onClick={() => navigate('/student/assignments')}>
                     Hủy
                  </button>
               </div>
            </form>
         </div>
      </div>
   );
}
