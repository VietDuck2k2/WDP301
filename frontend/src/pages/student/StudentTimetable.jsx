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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Lịch học</h1>
        <p className="text-[#617589] dark:text-gray-400">Xem lịch học theo tuần.</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={prevWeek}
          className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
          Tuần trước
        </button>
        <span className="font-semibold text-[#111418] dark:text-white">
          Tuần {new Date(weekStart).toLocaleDateString('vi-VN')}
        </span>
        <button
          onClick={nextWeek}
          className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Tuần sau
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>
      ) : (
        <p className="text-[#617589] dark:text-gray-400">
          Lịch học chi tiết theo buổi sẽ hiển thị khi backend có API sessions cho student.
        </p>
      )}
    </div>
  );
}
