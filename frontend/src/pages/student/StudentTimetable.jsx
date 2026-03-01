import { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default function StudentTimetable() {
  const [weekStart, setWeekStart] = useState(() => {
    const m = getMonday(new Date());
    return m.toISOString().split('T')[0];
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    studentApi
      .getClasses()
      .then((res) => {
        if (res.success && res.data) {
          const classes = res.data.classes || res.data || [];
          const start = new Date(weekStart);
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          const startStr = start.toISOString().split('T')[0];
          const endStr = end.toISOString().split('T')[0];
          const promises = classes.map((c) =>
            studentApi.getClassAssignments(c._id).catch(() => ({ data: [] }))
          );
          return Promise.all(promises).then(() => classes);
        }
        return [];
      })
      .then((classes) => {
        setSessions([]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Tải thất bại');
        setLoading(false);
      });
  }, [weekStart]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split('T')[0]);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch học</h1>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={prevWeek}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Tuần trước
        </button>
        <span className="font-medium">
          Tuần {new Date(weekStart).toLocaleDateString('vi-VN')}
        </span>
        <button
          onClick={nextWeek}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Tuần sau
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <p className="text-gray-500">
          Lịch học chi tiết theo buổi sẽ hiển thị khi backend có API sessions cho student.
        </p>
      )}
    </div>
  );
}
