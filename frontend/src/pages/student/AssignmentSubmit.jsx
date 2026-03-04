import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import FileUpload from '../../components/FileUpload';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

export default function AssignmentSubmit() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    studentApi.getAssignmentById(id).then((res) => { if (res?.success && res.data) setAssignment(res.data); });
    studentApi.getMySubmissionForAssignment(id).then((res) => {
      if (res?.success && res.data) { setMySubmission(res.data); setContent(res.data.content || ''); setAttachments(res.data.attachments || []); }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    studentApi.submitAssignment(id, { content, attachments })
      .then((res) => { if (res?.success) { setMySubmission(res.data); setSuccess(true); } else setError(res?.message || 'Nộp bài thất bại'); })
      .catch((err) => setError(err.response?.data?.message || 'Nộp bài thất bại'))
      .finally(() => setSubmitting(false));
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setError('');
    studentApi.saveDraft(id, { content }).then((res) => { if (res?.success) setMySubmission(res.data); }).catch(() => {}).finally(() => setSubmitting(false));
  };

  if (loading || !assignment) return <div className="page-card"><p>Đang tải...</p></div>;

  return (
    <div className="page-card">
      <h1 className="page-title">{assignment.title}</h1>
      <p className="muted">Lớp: {assignment.class?.name} · Hạn nộp: {formatDate(assignment.dueDate)}</p>
      <p>{assignment.description}</p>
      {assignment.instructions && <p><strong>Hướng dẫn:</strong> {assignment.instructions}</p>}
      {mySubmission?.status === 'graded' && (
        <div className="result-box">
          <p>Điểm: {mySubmission.score}/{assignment.maxScore}</p>
          <p>Nhận xét: {mySubmission.feedback}</p>
        </div>
      )}
      {mySubmission?.status !== 'graded' && (
        <form onSubmit={handleSubmit} className="form-card">
          <textarea placeholder="Nội dung bài làm" value={content} onChange={(e) => setContent(e.target.value)} className="form-input" rows={6} />
          <FileUpload value={attachments} onChange={setAttachments} label="Tệp đính kèm" />
          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">Đã nộp bài thành công.</p>}
          <div>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Đang nộp...' : 'Nộp bài'}</button>
            <button type="button" className="btn-secondary" onClick={handleSaveDraft} disabled={submitting}>Lưu nháp</button>
          </div>
        </form>
      )}
    </div>
  );
}
