import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

export default function StudentGrades() {
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    studentApi
      .getGrades()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setGrades(d.grades || []);
          setSummary(d.summary || null);
        }
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

  const gradedRows = grades.filter((g) => g.submission && g.submission.status === 'graded');
  const gradedCount = summary?.graded ?? gradedRows.length;
  const avg =
    summary?.averagePercentage != null
      ? String(summary.averagePercentage)
      : gradedRows.length > 0
        ? (gradedRows.reduce((a, g) => a + (parseFloat(g.submission?.percentage) || 0), 0) / gradedRows.length).toFixed(1)
        : '-';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Bảng điểm</h1>
        <p className="text-[#617589] dark:text-gray-400">Xem điểm và nhận xét từ giáo viên.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-[#1a242f] border border-[#f0f2f4] dark:border-gray-800 rounded-xl">
          <p className="text-2xl font-black text-[#111418] dark:text-white">{gradedCount}</p>
          <p className="text-sm text-[#617589] dark:text-gray-400">Bài đã chấm</p>
        </div>
        <div className="p-5 bg-white dark:bg-[#1a242f] border border-[#f0f2f4] dark:border-gray-800 rounded-xl">
          <p className="text-2xl font-black text-primary">{typeof avg === 'number' ? avg.toFixed(1) : avg}</p>
          <p className="text-sm text-[#617589] dark:text-gray-400">Điểm trung bình (%)</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>
      ) : (
        <div className="bg-white dark:bg-[#1a242f] border border-[#f0f2f4] dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f0f2f4] dark:bg-gray-800">
                <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Bài tập</th>
                <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Lớp</th>
                <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Điểm</th>
                <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Nhận xét</th>
                <th className="px-4 py-3 text-left font-semibold text-[#111418] dark:text-white">Ngày chấm</th>
              </tr>
            </thead>
            <tbody>
              {gradedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#617589] dark:text-gray-400">
                    Chưa có bài nào được chấm.
                  </td>
                </tr>
              ) : (
                gradedRows.map((g) => {
                  const sub = g.submission;
                  const asgn = g.assignment;
                  return (
                    <tr key={asgn?._id + (sub?.gradedAt || '')} className="border-t border-[#f0f2f4] dark:border-gray-800">
                      <td className="px-4 py-3 font-medium text-[#111418] dark:text-white">{asgn?.title || '-'}</td>
                      <td className="px-4 py-3 text-[#617589] dark:text-gray-400">{asgn?.class?.name || '-'}</td>
                      <td className="px-4 py-3 font-bold text-primary">{sub?.score != null ? `${sub.score}/${asgn?.maxScore ?? '-'}` : '-'}</td>
                      <td className="px-4 py-3 text-[#617589] dark:text-gray-400">{sub?.feedback || '-'}</td>
                      <td className="px-4 py-3 text-[#617589] dark:text-gray-400">
                        {sub?.gradedAt ? new Date(sub.gradedAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
