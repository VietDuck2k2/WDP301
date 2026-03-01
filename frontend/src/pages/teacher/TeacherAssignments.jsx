import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

const STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Đã phát hành',
  closed: 'Đã đóng',
};

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [classId, setClassId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    teacherApi
      .getAssignments(classId || undefined, page)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setAssignments(d.assignments || []);
          setPagination(d.pagination || {});
        }
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [classId, page]);

  useEffect(() => {
    teacherApi.getClasses().then((res) => {
      if (res.success && res.data) {
        const d = res.data;
        setClasses(d.classes || d || []);
      }
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bài tập</h1>

      <div className="flex gap-4 mb-4">
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <>
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-medium">Lớp</th>
                  <th className="px-4 py-3 text-left font-medium">Hạn nộp</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="px-4 py-3 font-medium">{a.title}</td>
                    <td className="px-4 py-3">{a.class?.name || '-'}</td>
                    <td className="px-4 py-3">
                      {a.dueDate
                        ? new Date(a.dueDate).toLocaleDateString('vi-VN')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          a.status === 'published'
                            ? 'bg-blue-100 text-blue-700'
                            : a.status === 'closed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/teacher/assignments/${a._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Xem / Chấm
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-3 py-1">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
