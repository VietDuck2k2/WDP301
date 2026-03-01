import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

export default function StudentGrades() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    studentApi
      .getMySubmissions({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          const list = d.submissions || (Array.isArray(d) ? d : []);
          setSubmissions(list.filter((s) => s.status === 'graded'));
        }
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

  const graded = submissions.filter((s) => s.score != null);
  const avg =
    graded.length > 0
      ? (graded.reduce((a, s) => a + s.score, 0) / graded.length).toFixed(1)
      : '-';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bảng điểm</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white border rounded-lg">
          <p className="text-2xl font-bold">{graded.length}</p>
          <p className="text-sm text-gray-500">Bài đã chấm</p>
        </div>
        <div className="p-4 bg-white border rounded-lg">
          <p className="text-2xl font-bold">{avg}</p>
          <p className="text-sm text-gray-500">Điểm trung bình</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Bài tập</th>
                <th className="px-4 py-3 text-left font-medium">Lớp</th>
                <th className="px-4 py-3 text-left font-medium">Điểm</th>
                <th className="px-4 py-3 text-left font-medium">Nhận xét</th>
                <th className="px-4 py-3 text-left font-medium">Ngày chấm</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Chưa có bài nào được chấm.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s._id} className="border-t">
                    <td className="px-4 py-3">
                      {s.assignment?.title || '-'}
                    </td>
                    <td className="px-4 py-3">-</td>
                    <td className="px-4 py-3 font-medium">
                      {s.score}/{s.assignment?.maxScore ?? '-'}
                    </td>
                    <td className="px-4 py-3">{s.feedback || '-'}</td>
                    <td className="px-4 py-3">
                      {s.gradedAt
                        ? new Date(s.gradedAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
