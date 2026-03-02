import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import '../../pages/PageCommon.css';

export default function AssignmentDetail() {
   const { id } = useParams();
   const navigate = useNavigate();
   const [assignment, setAssignment] = useState(null);
   const [submissions, setSubmissions] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [grading, setGrading] = useState({});
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      if (!id) return;
      setLoading(true);
      Promise.all([
         teacherApi.getAssignmentById(id),
         teacherApi.getAssignmentSubmissions(id),
      ])
         .then(([aRes, sRes]) => {
            if (aRes?.success && aRes.data) setAssignment(aRes.data);
            if (sRes?.success && sRes.data) setSubmissions(Array.isArray(sRes.data) ? sRes.data : sRes.data?.submissions || []);
         })
         .catch(() => setError('Không tải được dữ liệu.'))
         .finally(() => setLoading(false));
   }, [id]);

   const handleGrade = async (submissionId) => {
      const g = grading[submissionId];
      if (g == null || g.score === '' || g.score === undefined) return;
      setSubmitting(true);
      try {
         const res = await teacherApi.gradeSubmission(submissionId, {
            score: Number(g.score),
            feedback: g.feedback || '',
         });
         if (res?.success && res.data) {
            setSubmissions((prev) => prev.map((s) => (s._id === submissionId ? res.data : s)));
            setGrading((prev) => ({ ...prev, [submissionId]: {} }));
         }
      } catch (_) {}
      setSubmitting(false);
   };

   if (loading) return <div className="page-common"><p className="page-common-loading">Đang tải...</p></div>;
   if (error || !assignment) {
      return (
         <div className="page-common">
            <p className="page-common-error">{error || 'Không tìm thấy bài tập.'}</p>
            <button type="button" className="page-common-btn" onClick={() => navigate('/teacher/assignments')}>
               Quay lại
            </button>
         </div>
      );
   }

   const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">{assignment.title}</h1>
         <div className="page-common-card">
            <p><strong>Lớp:</strong> {assignment.class?.name}</p>
            <p><strong>Hạn nộp:</strong> {formatDate(assignment.dueDate)}</p>
            <p><strong>Điểm tối đa:</strong> {assignment.maxScore}</p>
            {assignment.description && <p>{assignment.description}</p>}
         </div>
         <h2 style={{ marginBottom: 12 }}>Bài nộp</h2>
         {submissions.length === 0 && <p className="page-common-empty">Chưa có bài nộp.</p>}
         {submissions.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Học sinh</th>
                        <th>Nộp lúc</th>
                        <th>Điểm</th>
                        <th>Nhận xét</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {submissions.map((s) => {
                        const name = [s.student?.firstName, s.student?.lastName].filter(Boolean).join(' ') || s.student?.email;
                        const g = grading[s._id] || {};
                        return (
                           <tr key={s._id}>
                              <td>{name}</td>
                              <td>{formatDate(s.submittedAt)}</td>
                              <td>
                                 {s.status === 'graded' ? (
                                    s.score
                                 ) : (
                                    <input
                                       type="number"
                                       min={0}
                                       max={assignment.maxScore}
                                       value={g.score ?? ''}
                                       onChange={(e) =>
                                          setGrading((prev) => ({
                                             ...prev,
                                             [s._id]: { ...prev[s._id], score: e.target.value },
                                          }))
                                       }
                                       className="page-common-input"
                                       style={{ width: 80 }}
                                    />
                                 )}
                              </td>
                              <td>
                                 {s.status === 'graded' ? (
                                    s.feedback || '-'
                                 ) : (
                                    <input
                                       type="text"
                                       value={g.feedback ?? ''}
                                       onChange={(e) =>
                                          setGrading((prev) => ({
                                             ...prev,
                                             [s._id]: { ...prev[s._id], feedback: e.target.value },
                                          }))
                                       }
                                       className="page-common-input"
                                       placeholder="Nhận xét"
                                    />
                                 )}
                              </td>
                              <td>
                                 {s.status !== 'graded' && (
                                    <button
                                       type="button"
                                       className="page-common-btn page-common-btn-primary"
                                       disabled={submitting || g.score === ''}
                                       onClick={() => handleGrade(s._id)}
                                    >
                                       Lưu điểm
                                    </button>
                                 )}
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         )}
         <button type="button" className="page-common-btn" onClick={() => navigate('/teacher/assignments')}>
            Quay lại danh sách
         </button>
      </div>
   );
}
