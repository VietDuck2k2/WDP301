import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({});
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    if (!id) return;
    teacherApi.getAssignmentById(id).then((res) => {
      if (res?.success && res.data) setAssignment(res.data);
    }).finally(() => setLoading(false));
    teacherApi.getAssignmentSubmissions(id).then((res) => {
      if (res?.success && res.data) setSubmissions(Array.isArray(res.data) ? res.data : []);
    });
  }, [id]);

  const handleGrade = async (subId) => {
    const score = grading[subId]; const fb = feedback[subId];
    if (score == null || score === '') return;
    await teacherApi.gradeSubmission(subId, { score: Number(score), feedback: fb || '' });
    setSubmissions((prev) => prev.map((s) => (s._id === subId ? { ...s, score: Number(score), feedback: fb || '', status: 'graded' } : s)));
  };

  if (loading || !assignment) return <div className="page-card"><p>Đang tải...</p></div>;

  return (
    <div className="page-card">
      <h1 className="page-title">{assignment.title}</h1>
      <p className="muted">Lớp: {assignment.class?.name} · Hạn nộp: {formatDate(assignment.dueDate)} · Điểm tối đa: {assignment.maxScore}</p>
      <p>{assignment.description}</p>
      <h2>Bài nộp ({submissions.length})</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Học sinh</th><th>Nộp lúc</th><th>Trạng thái</th><th>Điểm</th><th>Nhận xét</th><th></th></tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s._id}>
                <td>{s.student?.firstName} {s.student?.lastName}</td>
                <td>{formatDate(s.submittedAt)}</td>
                <td>{s.status}</td>
                <td>{s.score != null ? s.score : <input type="number" min="0" max={assignment.maxScore} className="form-input w-20" value={grading[s._id] ?? ''} onChange={(e) => setGrading((g) => ({ ...g, [s._id]: e.target.value }))} />}</td>
                <td>{s.feedback != null ? s.feedback : <input type="text" className="form-input" placeholder="Nhận xét" value={feedback[s._id] ?? ''} onChange={(e) => setFeedback((f) => ({ ...f, [s._id]: e.target.value }))} />}</td>
                <td>{s.score == null && (grading[s._id] != null && grading[s._id] !== '') && <button type="button" className="btn-primary" onClick={() => handleGrade(s._id)}>Lưu điểm</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {submissions.length === 0 && <p className="empty">Chưa có bài nộp.</p>}
      </div>
    </div>
  );
}
