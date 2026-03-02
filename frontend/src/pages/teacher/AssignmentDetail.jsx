import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grading, setGrading] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      teacherApi.getAssignmentById(id),
      teacherApi.getAssignmentSubmissions(id),
    ])
      .then(([aRes, sRes]) => {
        if (aRes.success && aRes.data) setAssignment(aRes.data);
        if (sRes.success && sRes.data) setSubmissions(Array.isArray(sRes.data) ? sRes.data : []);
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
      .gradeSubmission(subId, { score: Number(g.score), feedback: g.feedback || '' })
      .then((res) => {
        if (res.success && res.data) {
          setSubmissions((prev) => prev.map((s) => (s._id === subId ? res.data : s)));
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

  if (loading) return <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>;
  if (error)
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  if (!assignment) return null;

  const safeIndex = submissions.length ? Math.max(0, Math.min(currentIndex, submissions.length - 1)) : 0;
  const current = submissions[safeIndex];

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[#617589] dark:text-gray-400">
        <Link to="/teacher/assignments" className="hover:text-primary">Bài tập</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#111418] dark:text-white font-medium">{assignment.title} • Chấm điểm</span>
      </nav>

      <div className="flex flex-wrap justify-between items-end gap-3">
        <h1 className="text-2xl font-black text-[#111418] dark:text-white">
          {assignment.title} - Chấm điểm
        </h1>
        {submissions.length > 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              className="flex items-center gap-1 rounded-lg h-9 px-3 border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-[#1a242f] text-[#111418] dark:text-white text-sm font-bold disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Trước
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.min(submissions.length - 1, i + 1))}
              disabled={safeIndex >= submissions.length - 1}
              className="flex items-center gap-1 rounded-lg h-9 px-3 border border-[#e5e7eb] dark:border-gray-700 bg-white dark:bg-[#1a242f] text-[#111418] dark:text-white text-sm font-bold disabled:opacity-50"
            >
              Sau
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <p className="text-[#617589] dark:text-gray-400">Chưa có bài nộp.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Submission details */}
          <div className="lg:col-span-3 space-y-4">
            {submissions.map((s, idx) => (
              <div
                key={s._id}
                className={`p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm ${
                  idx !== safeIndex ? 'hidden' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-lg font-bold text-[#111418] dark:text-white">
                    {s.student?.firstName} {s.student?.lastName}
                  </h2>
                  {s.status === 'graded' ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      ĐÃ CHẤM: {s.score}/{assignment.maxScore}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      Chờ chấm
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#617589] dark:text-gray-400 mb-2">
                  Nộp lúc: {s.submittedAt ? new Date(s.submittedAt).toLocaleString('vi-VN') : '-'}
                  {s.isLate && <span className="text-red-600 dark:text-red-400 ml-2">(Nộp muộn)</span>}
                </p>
                {s.content && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase text-[#617589] dark:text-gray-400 mb-1">Nội dung</p>
                    <pre className="text-sm bg-[#f0f2f4] dark:bg-gray-800 p-3 rounded-lg whitespace-pre-wrap text-[#111418] dark:text-gray-300">
                      {s.content}
                    </pre>
                  </div>
                )}
                {s.attachments?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#617589] dark:text-gray-400 mb-2">File đính kèm</p>
                    <div className="flex flex-col gap-2">
                      {s.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-primary font-medium hover:bg-primary/10"
                        >
                          <span className="material-symbols-outlined">description</span>
                          {att.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {s.status === 'graded' && s.feedback && (
                  <p className="text-sm text-[#617589] dark:text-gray-400 mt-3">Nhận xét: {s.feedback}</p>
                )}
              </div>
            ))}
          </div>

          {/* Right: Grading & Feedback card */}
          <div className="lg:col-span-2">
            {current && (
              <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm sticky top-24">
                <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Chấm điểm & Nhận xét</h3>
                {current.status !== 'graded' ? (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                        Điểm bài làm
                      </label>
                      <div className="flex items-baseline gap-2">
                        <input
                          type="number"
                          min={0}
                          max={assignment.maxScore}
                          value={grading[current._id]?.score ?? ''}
                          onChange={(e) =>
                            handleGrade(current._id, e.target.value, grading[current._id]?.feedback)
                          }
                          className="w-20 bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-lg font-bold text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
                        />
                        <span className="text-[#617589] dark:text-gray-400">/ {assignment.maxScore}</span>
                      </div>
                      <p className="text-xs text-[#617589] dark:text-gray-400 mt-1">Điểm đạt: 60/{assignment.maxScore}</p>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                        Nhận xét giáo viên
                      </label>
                      <textarea
                        value={grading[current._id]?.feedback ?? ''}
                        onChange={(e) =>
                          handleGrade(current._id, grading[current._id]?.score, e.target.value)
                        }
                        placeholder="Nhập nhận xét chi tiết..."
                        rows={4}
                        className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <button
                      onClick={() => submitGrade(current._id)}
                      disabled={savingId === current._id}
                      className="w-full flex items-center justify-center gap-2 rounded-lg h-11 bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">save</span>
                      {savingId === current._id ? 'Đang lưu...' : 'Lưu điểm'}
                    </button>
                  </>
                ) : (
                  <div className="text-[#617589] dark:text-gray-400 text-sm">
                    Đã chấm: <strong className="text-primary">{current.score}/{assignment.maxScore}</strong>
                    {current.feedback && (
                      <p className="mt-2 p-2 rounded-lg bg-[#f0f2f4] dark:bg-gray-800">{current.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
