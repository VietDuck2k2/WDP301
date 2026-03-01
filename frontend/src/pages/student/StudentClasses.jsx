import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lớp học của tôi</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.length === 0 ? (
            <p className="text-gray-500">Bạn chưa đăng ký lớp nào.</p>
          ) : (
            classes.map((c) => (
              <div
                key={c._id}
                className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md"
              >
                <h3 className="font-bold text-lg">{c.name}</h3>
                <p className="text-sm text-gray-500">{c.code}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {c.room && `Phòng ${c.room}`}
                  {c.startDate && (
                    <> • Bắt đầu: {new Date(c.startDate).toLocaleDateString('vi-VN')}</>
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/student/assignments?classId=${c._id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Bài tập
                  </Link>
                  <Link
                    to={`/student/announcements?classId=${c._id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Thông báo
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
