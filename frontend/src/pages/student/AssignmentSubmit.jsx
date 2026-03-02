import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import axiosInstance from '../../api/axios';

export default function AssignmentSubmit() {
  const { id } = useParams();
  const fileInputRef = useRef(null);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      studentApi.getAssignmentById(id),
      studentApi.getMySubmission(id),
    ])
      .then(([aRes, sRes]) => {
        if (aRes.success && aRes.data) setAssignment(aRes.data);
        if (sRes.success && sRes.data) {
          setSubmission(sRes.data);
          setContent(sRes.data.content || '');
          setAttachments(sRes.data.attachments || []);
        }
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axiosInstance.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res?.data;
      if (d) {
        let url = d.downloadUrl || d.fileUrl || d.url;
        if (url && url.startsWith('/')) {
          const base = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
          url = base.replace(/\/api\/?$/, '') + url;
        }
        if (url) {
          setAttachments((prev) => [...prev, { name: d.name || file.name, url }]);
        }
      }
    } catch (err) {
      alert(err.message || 'Upload thất bại');
    }
  };

  const handleSubmit = async (isDraft = false) => {
    setSubmitting(true);
    setError(null);
    const body = { content, attachments };
    const fn = isDraft ? studentApi.saveDraft : studentApi.submitAssignment;
    fn(id, body)
      .then(() => {
        alert(isDraft ? 'Đã lưu nháp' : 'Nộp bài thành công!');
        if (!isDraft) {
          studentApi.getMySubmission(id).then((r) => {
            if (r.success && r.data) setSubmission(r.data);
          });
        }
      })
      .catch((err) => setError(err.message || 'Thất bại'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>;
  if (error && !assignment)
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  if (!assignment) return null;

  const isGraded = submission?.status === 'graded';
  const isSubmitted = submission?.status === 'submitted' || isGraded;
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const now = new Date();
  const remainingMs = dueDate ? dueDate - now : 0;
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  const refs = assignment.attachments || [];

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-2 text-sm text-[#617589] dark:text-gray-400">
        <Link to="/student/assignments" className="hover:text-primary">Bài tập</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#111418] dark:text-white font-medium">{assignment.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">BÀI TẬP</span>
            <h1 className="text-2xl font-black text-[#111418] dark:text-white">{assignment.title}</h1>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#617589] dark:text-gray-400">
            {dueDate && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">event</span>
                Hạn: {dueDate.toLocaleDateString('vi-VN')} {dueDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {remainingMs > 0 && (
              <span className={`flex items-center gap-1 ${remainingDays <= 2 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                <span className="material-symbols-outlined text-lg">schedule</span>
                Còn lại: {remainingDays} ngày
              </span>
            )}
          </div>
        </div>
      </div>

      {isGraded && (
        <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <p className="font-bold text-emerald-700 dark:text-emerald-400">Điểm: {submission.score}/{assignment.maxScore}</p>
          {submission.feedback && <p className="text-sm text-[#617589] dark:text-gray-400 mt-1">Nhận xét: {submission.feedback}</p>}
        </div>
      )}

      {!isSubmitted && (
        <>
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: Instructions + Reference materials */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-[#111418] dark:text-white flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary">info</span>
                  Hướng dẫn bài làm
                </h3>
                <p className="text-[#111418] dark:text-gray-300 whitespace-pre-wrap">{assignment.description || 'Không có mô tả.'}</p>
                {assignment.instructions && (
                  <>
                    <p className="font-semibold text-[#111418] dark:text-white mt-3">Yêu cầu:</p>
                    <p className="text-sm text-[#617589] dark:text-gray-400 whitespace-pre-wrap">{assignment.instructions}</p>
                  </>
                )}
              </div>
              {refs.length > 0 && (
                <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
                  <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-3">Tài liệu tham khảo</h3>
                  <ul className="space-y-2">
                    {refs.map((r, i) => (
                      <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#f6f7f8] dark:bg-gray-800">
                        <span className="material-symbols-outlined text-primary">description</span>
                        <span className="text-sm font-medium text-[#111418] dark:text-white">{r.name || 'File'}</span>
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-sm">
                          <span className="material-symbols-outlined text-lg">download</span>
                          Tải
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right column: Your Submission + Comments */}
            <div className="space-y-4">
              <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-3">Bài nộp của bạn</h3>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung bài làm..."
                  rows={5}
                  className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary/50 mb-3"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#e5e7eb] dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-4xl text-primary mb-2 block">cloud_upload</span>
                  <p className="text-sm font-medium text-[#111418] dark:text-white">Kéo thả file vào đây hoặc</p>
                  <p className="text-sm text-primary font-bold mt-1">Chọn file</p>
                  <p className="text-xs text-[#617589] dark:text-gray-400 mt-1">PDF, DOCX tối đa 10MB</p>
                </div>
                {attachments.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {attachments.map((a, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">
                          {a.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-3">Ghi chú</h3>
                <input
                  type="text"
                  placeholder="Thêm ghi chú (tùy chọn)..."
                  className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg h-10 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">save</span>
                  Lưu nháp
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg h-10 bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  {submitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isSubmitted && !isGraded && (
        <p className="text-primary font-bold">Bạn đã nộp bài. Đang chờ giáo viên chấm.</p>
      )}
    </div>
  );
}
