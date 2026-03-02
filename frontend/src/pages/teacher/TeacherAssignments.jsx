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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Bài tập</h1>
        <p className="text-[#617589] dark:text-gray-400">Quản lý và chấm bài tập theo lớp.</p>
      </div>

      <div className="flex gap-4">
        <select
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setPage(1);
          }}
          className="bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-4 h-10 text-sm text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
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
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>
      ) : (
        <>
          <div className="bg-white dark:bg-[#1a242f] border border-[#f0f2f4] dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f0f2f4] dark:bg-gray-800">
                  <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Tiêu đề</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Lớp</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Hạn nộp</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id} className="border-t border-[#f0f2f4] dark:border-gray-800">
                    <td className="px-4 py-3 font-medium text-[#111418] dark:text-white">{a.title}</td>
                    <td className="px-4 py-3 text-[#617589] dark:text-gray-400">{a.class?.name || '-'}</td>
                    <td className="px-4 py-3 text-[#617589] dark:text-gray-400">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          a.status === 'published'
                            ? 'bg-primary/20 text-primary'
                            : a.status === 'closed'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-[#617589] dark:text-gray-400'
                        }`}
                      >
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/teacher/assignments/${a._id}`}
                        className="font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-lg">grading</span>
                        Xem / Chấm
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg h-9 px-3 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
                Trước
              </button>
              <span className="text-sm text-[#617589] dark:text-gray-400">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="flex items-center gap-1 rounded-lg h-9 px-3 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold disabled:opacity-50"
              >
                Sau
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
