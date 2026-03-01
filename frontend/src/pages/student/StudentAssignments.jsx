import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

export default function StudentAssignments() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        if (classId) {
          const res = await studentApi.getClassAssignments(classId);
          if (res.success && res.data) {
            setAssignments(Array.isArray(res.data) ? res.data : []);
          }
        } else {
          const res = await studentApi.getClasses();
          if (res.success && res.data) {
            const cls = res.data.classes || res.data || [];
            setClasses(cls);
            if (cls.length > 0) {
              const results = await Promise.all(cls.map((c) => studentApi.getClassAssignments(c._id)));
              const all = results.flatMap((r) =>
                r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : []
              );
              setAssignments(all);
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Tải thất bại');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bài tập</h1>

      {!classId && classes.length > 1 && (
        <p className="text-gray-600 mb-4">Hiển thị bài tập từ tất cả các lớp.</p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <p className="text-gray-500">Không có bài tập.</p>
          ) : (
            assignments.map((a) => (
              <div
                key={a._id}
                className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">{a.title}</h3>
                  <p className="text-sm text-gray-500">
                    {a.class?.name} • Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Link
                  to={`/student/assignments/${a._id}/submit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Nộp bài
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
