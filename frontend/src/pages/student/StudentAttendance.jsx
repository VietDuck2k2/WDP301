import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

const STATUS_LABELS = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Muộn',
  excused: 'Có phép',
};

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      studentApi.getAttendanceSummary().catch(() => ({ data: null })),
      studentApi.getAttendances().catch(() => ({ data: [] })),
    ])
      .then(([sumRes, histRes]) => {
        if (sumRes?.success && sumRes?.data) {
          setSummary(sumRes.data);
        } else {
          setSummary(null);
        }
        if (histRes?.success && histRes?.data) {
          setHistory(Array.isArray(histRes.data) ? histRes.data : []);
        } else {
          setHistory([]);
        }
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Điểm danh</h1>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-2xl font-bold">{summary.total || 0}</p>
            <p className="text-sm text-gray-500">Tổng buổi</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-2xl font-bold text-green-600">{summary.present || 0}</p>
            <p className="text-sm text-gray-500">Có mặt</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-2xl font-bold text-red-600">{summary.absent || 0}</p>
            <p className="text-sm text-gray-500">Vắng</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{summary.late || 0}</p>
            <p className="text-sm text-gray-500">Muộn</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="text-2xl font-bold">{summary.attendanceRate || '0'}%</p>
            <p className="text-sm text-gray-500">Tỷ lệ có mặt</p>
          </div>
        </div>
      )}

      {!summary && !loading && (
        <p className="text-gray-500 mb-4">
          API điểm danh học sinh chưa có trên backend. Khi backend triển khai, dữ liệu sẽ hiển thị tại đây.
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : history.length > 0 ? (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left font-medium">Buổi học</th>
                <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium">Ngày điểm danh</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id} className="border-t">
                  <td className="px-4 py-3">{h.session?.title || '-'}</td>
                  <td className="px-4 py-3">
                    {STATUS_LABELS[h.status] || h.status}
                  </td>
                  <td className="px-4 py-3">
                    {h.markedAt
                      ? new Date(h.markedAt).toLocaleString('vi-VN')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
