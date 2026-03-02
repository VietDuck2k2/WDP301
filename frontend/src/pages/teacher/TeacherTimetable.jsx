import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default function TeacherTimetable() {
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
    teacherApi
      .getTimetable(weekStart)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setSessions(d.sessions || []);
        }
      })
      .catch((err) => setError(err.message || 'Tải lịch thất bại'))
      .finally(() => setLoading(false));
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

  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const daySlots = {};
  days.forEach((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    daySlots[d.toISOString().split('T')[0]] = days[i];
  });

  const sessionsByDate = {};
  sessions.forEach((s) => {
    const dateStr = s.date ? new Date(s.date).toISOString().split('T')[0] : null;
    if (dateStr) {
      if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
      sessionsByDate[dateStr].push(s);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Lịch dạy</h1>
        <p className="text-[#617589] dark:text-gray-400">Xem và quản lý các buổi dạy trong tuần.</p>
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
        <div className="flex flex-col gap-4">
          {sessions.length === 0 ? (
            <p className="text-[#617589] dark:text-gray-400">Không có buổi học trong tuần này.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s._id}
                className="p-5 bg-white dark:bg-[#1a242f] border border-[#f0f2f4] dark:border-gray-800 rounded-xl flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-[#111418] dark:text-white">{s.title || `Buổi ${s.sessionNumber}`}</h3>
                  <p className="text-sm text-[#617589] dark:text-gray-400">
                    {s.class?.name} • {s.room || '-'} • {s.startTime} - {s.endTime}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(s.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <Link
                  to={`/teacher/sessions/${s._id}/attendance`}
                  className="flex items-center gap-2 rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-lg">fact_check</span>
                  Điểm danh
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
