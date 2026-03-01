import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grading, setGrading] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      teacherApi.getAssignmentById(id),
      teacherApi.getAssignmentSubmissions(id),
    ])
      .then(([aRes, sRes]) => {
        if (aRes.success && aRes.data) setAssignment(aRes.data);
        if (sRes.success && sRes.data) setSubmissions(sRes.data);
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGrade = (subId, score, feedback) => {
    setGrading((prev) => ({ ...prev, [subId]: { score, feedback } }));
  };

  const submitGrade = async (subId) => {
    const g = grading[subId];
    if (!g || g.score === '' || g.score === undefined) {
      alert('Vui lòng nhập điểm');
      return;
    }
    setSavingId(subId);
    teacherApi
      .gradeSubmission(subId, {
        score: Number(g.score),
        feedback: g.feedback || '',
      })
      .then((res) => {
        if (res.success && res.data) {
          setSubmissions((prev) =>
            prev.map((s) => (s._id === subId ? res.data : s))
          );
          setGrading((prev) => {
            const next = { ...prev };
            delete next[subId];
            return next;
          });
        }
      })
      .catch((err) => alert(err.message || 'Chấm thất bại'))
      .finally(() => setSavingId(null));
  };

  if (loading) return <p className="text-gray-500">Đang tải...</p>;
  if (error) return <div className="p-3 bg-red-50 text-red-600 rounded">{error}</div>;
  if (!assignment) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
      <p className="text-gray-600 mb-4">
        {assignment.class?.name} • Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')} • Điểm tối đa: {assignment.maxScore}
      </p>
      {assignment.description && (
        <p className="text-sm text-gray-500 mb-6">{assignment.description}</p>
      )}

      <h2 className="text-lg font-bold mb-4">Bài nộp ({submissions.length})</h2>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <p className="text-gray-500">Chưa có bài nộp.</p>
        ) : (
          submissions.map((s) => (
            <div
              key={s._id}
              className="p-4 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">
                  {s.student?.firstName} {s.student?.lastName}
                </h3>
                {s.status === 'graded' ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-sm">
                    Đã chấm: {s.score}/{assignment.maxScore}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                    Chờ chấm
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Nộp lúc: {s.submittedAt ? new Date(s.submittedAt).toLocaleString('vi-VN') : '-'}
                {s.isLate && <span className="text-red-600 ml-2">(Nộp muộn)</span>}
              </p>
              {s.content && (
                <pre className="text-sm bg-gray-50 p-2 rounded mb-2 whitespace-pre-wrap">
                  {s.content}
                </pre>
              )}
              {s.attachments?.length > 0 && (
                <div className="mb-2">
                  {s.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-sm block"
                    >
                      {att.name}
                    </a>
                  ))}
                </div>
              )}

              {s.status !== 'graded' && (
                <div className="mt-3 flex gap-4 items-end">
                  <div>
                    <label className="block text-xs text-gray-500">Điểm</label>
                    <input
                      type="number"
                      min={0}
                      max={assignment.maxScore}
                      value={grading[s._id]?.score ?? ''}
                      onChange={(e) =>
                        handleGrade(s._id, e.target.value, grading[s._id]?.feedback)
                      }
                      className="border rounded px-2 py-1 w-20"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">Nhận xét</label>
                    <input
                      type="text"
                      value={grading[s._id]?.feedback ?? ''}
                      onChange={(e) =>
                        handleGrade(s._id, grading[s._id]?.score, e.target.value)
                      }
                      placeholder="Nhận xét..."
                      className="border rounded px-2 py-1 w-full"
                    />
                  </div>
                  <button
                    onClick={() => submitGrade(s._id)}
                    disabled={savingId === s._id}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingId === s._id ? 'Đang lưu...' : 'Chấm điểm'}
                  </button>
                </div>
              )}
              {s.status === 'graded' && s.feedback && (
                <p className="text-sm text-gray-600 mt-2">Nhận xét: {s.feedback}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
