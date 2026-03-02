import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('active'); // 'active' | 'archived'

  useEffect(() => {
    setLoading(true);
    setError(null);
    studentApi
      .getClasses()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setClasses(d.classes || d || []);
        }
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = classes.filter((c) => {
    const matchSearch = !search || (c.name && c.name.toLowerCase().includes(search.toLowerCase())) || (c.code && c.code.toLowerCase().includes(search.toLowerCase()));
    const isActive = c.status !== 'archived' && c.status !== 'ended';
    if (filter === 'archived') return matchSearch && !isActive;
    return matchSearch && isActive;
  });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Lớp học của tôi</h1>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-gray-400 text-xl">
              search
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên lớp..."
              className="w-full bg-[#f0f2f4] dark:bg-[#1e293b] border-none rounded-lg pl-10 pr-4 h-10 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Tabs: Active / Archived */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-[#e5e7eb] dark:border-gray-700">
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-4 py-2.5 text-sm font-bold transition-colors ${
              filter === 'active'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-[#1a242f] text-[#617589] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Đang học
          </button>
          <button
            type="button"
            onClick={() => setFilter('archived')}
            className={`px-4 py-2.5 text-sm font-bold transition-colors ${
              filter === 'archived'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-[#1a242f] text-[#617589] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            Đã kết thúc
          </button>
        </div>
        <p className="text-sm text-[#617589] dark:text-gray-400">
          Hiển thị <strong className="text-[#111418] dark:text-white">{filtered.length}</strong> lớp {filter === 'active' ? 'đang học' : 'đã kết thúc'}.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-[#617589] dark:text-gray-400">
              {filter === 'active' ? 'Bạn chưa đăng ký lớp nào.' : 'Không có lớp đã kết thúc.'}
            </p>
          ) : (
            filtered.map((c) => (
              <div
                key={c._id}
                className="p-5 bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      {c.level || c.code || 'LỚP'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#617589] dark:text-gray-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Đang học
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#111418] dark:text-white">{c.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#617589] dark:text-gray-400">
                    {c.room && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">meeting_room</span>
                        Phòng {c.room}
                      </span>
                    )}
                    {c.startDate && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                        Bắt đầu: {new Date(c.startDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-3 shrink-0">
                  <div className="px-4 py-2.5 rounded-lg bg-[#f0f2f4] dark:bg-gray-800 min-w-[180px]">
                    <p className="text-xs font-semibold text-[#617589] dark:text-gray-400 uppercase">Buổi tiếp theo</p>
                    <p className="text-sm font-bold text-[#111418] dark:text-white">—</p>
                    <p className="text-xs text-[#617589] dark:text-gray-400">Khi có lịch từ backend</p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/student/assignments?classId=${c._id}`}
                      className="flex items-center justify-center gap-2 rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-lg">assignment</span>
                      Bài tập
                    </Link>
                    <Link
                      to={`/student/announcements?classId=${c._id}`}
                      className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <span className="material-symbols-outlined text-lg">campaign</span>
                      Thông báo
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
