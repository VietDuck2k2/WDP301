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
    <div>
      <h1 className="text-2xl font-bold mb-4">Lịch dạy</h1>
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
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-gray-500">Không có buổi học trong tuần này.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s._id}
                className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">{s.title || `Session ${s.sessionNumber}`}</h3>
                  <p className="text-sm text-gray-500">
                    {s.class?.name} • {s.room || '-'} • {s.startTime} - {s.endTime}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/teacher/sessions/${s._id}/attendance`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Điểm danh
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
