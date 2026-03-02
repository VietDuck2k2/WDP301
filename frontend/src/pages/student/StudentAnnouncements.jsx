import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

const PRIORITY_LABELS = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export default function StudentAnnouncements() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (classId) {
      studentApi
        .getClassAnnouncements(classId)
        .then((res) => {
          if (res.success && res.data) {
            setAnnouncements(Array.isArray(res.data) ? res.data : []);
          }
        })
        .catch((err) => setError(err.message || 'Tải thất bại'))
        .finally(() => setLoading(false));
    } else {
      studentApi
        .getClasses()
        .then((res) => {
          if (res.success && res.data) {
            const cls = res.data.classes || res.data || [];
            setClasses(cls);
            if (cls.length === 0) {
              setLoading(false);
              return;
            }
            return Promise.all(cls.map((c) => studentApi.getClassAnnouncements(c._id)));
          }
        })
        .then((results) => {
          if (results && results.length > 0) {
            const all = results.flatMap((r) =>
              r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : []
            );
            setAnnouncements(all);
          }
        })
        .catch((err) => setError(err.message || 'Tải thất bại'))
        .finally(() => setLoading(false));
    }
  }, [classId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Thông báo</h1>
        <p className="text-[#617589] dark:text-gray-400">
          {!classId && classes.length > 1
            ? 'Hiển thị thông báo từ tất cả các lớp.'
            : 'Thông báo từ giáo viên và lớp học.'}
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
        <div className="flex flex-col gap-4">
          {announcements.length === 0 ? (
            <p className="text-[#617589] dark:text-gray-400">Không có thông báo.</p>
          ) : (
            announcements.map((a) => (
              <div
                key={a._id}
                className={`p-5 rounded-xl border ${
                  a.isPinned
                    ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 dark:border-primary/30'
                    : 'bg-white dark:bg-[#1a242f] border-[#f0f2f4] dark:border-gray-800'
                }`}
              >
                <h3 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                  {a.isPinned && <span className="material-symbols-outlined text-primary text-lg">push_pin</span>}
                  {a.title}
                </h3>
                <p className="text-sm text-[#617589] dark:text-gray-400 mt-1">
                  {a.class?.name || 'Lớp'} • {new Date(a.createdAt).toLocaleString('vi-VN')}
                </p>
                <p className="mt-2 text-[#111418] dark:text-gray-300">{a.content}</p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded-lg text-xs font-medium ${
                    a.priority === 'urgent'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : a.priority === 'high'
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-[#617589] dark:text-gray-400'
                  }`}
                >
                  {PRIORITY_LABELS[a.priority] || a.priority}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
