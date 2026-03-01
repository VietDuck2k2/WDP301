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
    <div>
      <h1 className="text-2xl font-bold mb-4">Thông báo</h1>

      {!classId && classes.length > 1 && (
        <p className="text-gray-600 mb-4">Hiển thị thông báo từ tất cả các lớp.</p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-gray-500">Không có thông báo.</p>
          ) : (
            announcements.map((a) => (
              <div
                key={a._id}
                className={`p-4 border rounded-lg ${
                  a.isPinned ? 'border-blue-300 bg-blue-50' : 'bg-white'
                }`}
              >
                <h3 className="font-bold flex items-center gap-2">
                  {a.isPinned && <span className="text-blue-600">📌</span>}
                  {a.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {a.class?.name || 'Lớp'} • {new Date(a.createdAt).toLocaleString('vi-VN')}
                </p>
                <p className="mt-2 text-gray-700">{a.content}</p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                    a.priority === 'urgent'
                      ? 'bg-red-100 text-red-700'
                      : a.priority === 'high'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
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
