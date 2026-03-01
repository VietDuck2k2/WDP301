import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import axiosInstance from '../../api/axios';

export default function AssignmentSubmit() {
  const { id } = useParams();
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
        if (aRes.success && aRes.data) {
          setAssignment(aRes.data);
        }
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
          const sRes = studentApi.getMySubmission(id);
          sRes.then((r) => {
            if (r.success && r.data) {
              setSubmission(r.data);
            }
          });
        }
      })
      .catch((err) => setError(err.message || 'Thất bại'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <p className="text-gray-500">Đang tải...</p>;
  if (error && !assignment) return <div className="p-3 bg-red-50 text-red-600 rounded">{error}</div>;
  if (!assignment) return null;

  const isGraded = submission?.status === 'graded';
  const isSubmitted = submission?.status === 'submitted' || isGraded;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
      <p className="text-gray-600 mb-4">
        {assignment.class?.name} • Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
      </p>
      {assignment.description && (
        <p className="text-sm text-gray-500 mb-6">{assignment.description}</p>
      )}

      {isGraded && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-medium">Điểm: {submission.score}/{assignment.maxScore}</p>
          {submission.feedback && <p className="text-sm mt-1">Nhận xét: {submission.feedback}</p>}
        </div>
      )}

      {!isSubmitted && (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nội dung bài làm</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={6}
                placeholder="Nhập nội dung..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">File đính kèm</label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="border rounded px-3 py-2"
              />
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((a, i) => (
                    <li key={i} className="text-sm">
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600">
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Lưu nháp
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            </div>
          </div>
        </>
      )}

      {isSubmitted && !isGraded && (
        <p className="text-blue-600">Bạn đã nộp bài. Đang chờ giáo viên chấm.</p>
      )}
    </div>
  );
}
