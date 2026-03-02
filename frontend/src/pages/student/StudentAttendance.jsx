import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

const STATUS_LABELS = {
  present: 'Có mặt',
  absent: 'Vắng',
  late: 'Muộn',
  excused: 'Có phép',
};

const STATUS_PILL = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  absent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  late: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  excused: 'bg-blue-100 text-primary dark:bg-primary/20 dark:text-primary',
};

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewTab, setViewTab] = useState('table'); // 'calendar' | 'table'

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      studentApi.getAttendanceSummary().catch(() => ({ data: null })),
      studentApi.getAttendances().catch(() => ({ data: [] })),
    ])
      .then(([sumRes, histRes]) => {
        if (sumRes?.success && sumRes?.data) setSummary(sumRes.data);
        else setSummary(null);
        if (histRes?.success && histRes?.data)
          setHistory(Array.isArray(histRes.data) ? histRes.data : []);
        else setHistory([]);
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

  const presentPct = summary?.total
    ? ((summary.present || 0) / summary.total * 100).toFixed(1)
    : '0';
  const absentPct = summary?.total
    ? ((summary.absent || 0) / summary.total * 100).toFixed(1)
    : '0';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Lịch sử điểm danh</h1>
        <p className="text-[#617589] dark:text-gray-400">
          Theo dõi sự tham gia và tỷ lệ đi học theo thời gian.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#617589] dark:text-gray-400">Tổng buổi</p>
              <span className="material-symbols-outlined text-[#617589] dark:text-gray-400">groups</span>
            </div>
            <p className="text-2xl font-black text-[#111418] dark:text-white mt-1">{summary.total || 0}</p>
            <a href="#history" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2">
              Xem lịch sử
            </a>
          </div>
          <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border-l-4 border-emerald-500 border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#617589] dark:text-gray-400">Có mặt</p>
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.present || 0}</p>
            <p className="text-xs text-[#617589] dark:text-gray-400 mt-1">{presentPct}% có mặt</p>
          </div>
          <div className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border-l-4 border-red-500 border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#617589] dark:text-gray-400">Vắng</p>
              <span className="material-symbols-outlined text-red-500">cancel</span>
            </div>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{summary.absent || 0}</p>
            <p className="text-xs text-[#617589] dark:text-gray-400 mt-1">{absentPct}% vắng</p>
          </div>
        </div>
      )}

      {!summary && !loading && (
        <p className="text-[#617589] dark:text-gray-400">
          Chưa có dữ liệu điểm danh. Khi backend cung cấp API, dữ liệu sẽ hiển thị tại đây.
        </p>
      )}

      {/* Tabs: Calendar View / Table View */}
      <div className="flex gap-1 border-b border-[#e5e7eb] dark:border-gray-700">
        <button
          type="button"
          onClick={() => setViewTab('calendar')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            viewTab === 'calendar'
              ? 'border-primary text-primary'
              : 'border-transparent text-[#617589] dark:text-gray-400'
          }`}
        >
          <span className="material-symbols-outlined text-lg">calendar_view_month</span>
          Lịch
        </button>
        <button
          type="button"
          onClick={() => setViewTab('table')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            viewTab === 'table'
              ? 'border-primary text-primary'
              : 'border-transparent text-[#617589] dark:text-gray-400'
          }`}
        >
          <span className="material-symbols-outlined text-lg">table_chart</span>
          Bảng
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {viewTab === 'calendar' && (
          <div className="flex-1">
            <p className="text-[#617589] dark:text-gray-400 text-sm">
              Xem lịch theo tháng sẽ hiển thị khi có dữ liệu phiên học từ backend.
            </p>
          </div>
        )}

        {viewTab === 'table' && (
          <div className="flex-1" id="history">
            <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Chi tiết điểm danh</h2>
            {loading ? (
              <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>
            ) : history.length > 0 ? (
              <div className="bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f7f8] dark:bg-gray-800/80">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                        Ngày
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                        Buổi học
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                        Giờ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                        Giáo viên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h._id} className="border-t border-[#f0f2f4] dark:border-gray-800">
                        <td className="px-4 py-3 text-[#111418] dark:text-white">
                          {h.session?.date
                            ? new Date(h.session.date).toLocaleDateString('vi-VN')
                            : h.markedAt
                              ? new Date(h.markedAt).toLocaleDateString('vi-VN')
                              : '-'}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#111418] dark:text-white">
                          {h.session?.title || '-'}
                        </td>
                        <td className="px-4 py-3 text-[#617589] dark:text-gray-400">-</td>
                        <td className="px-4 py-3 text-[#617589] dark:text-gray-400">
                          {h.markedBy?.firstName && h.markedBy?.lastName
                            ? `${h.markedBy.firstName} ${h.markedBy.lastName}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              STATUS_PILL[h.status] || STATUS_PILL.present
                            }`}
                          >
                            {STATUS_LABELS[h.status] || h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#617589] dark:text-gray-400">Chưa có bản ghi điểm danh.</p>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="lg:w-56 shrink-0">
          <div className="p-4 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-[#617589] dark:text-gray-400 mb-3">
              Chú thích
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-[#111418] dark:text-white">Có mặt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-[#111418] dark:text-white">Vắng</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-[#111418] dark:text-white">Muộn</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-[#111418] dark:text-white">Hôm nay / Đã chọn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
