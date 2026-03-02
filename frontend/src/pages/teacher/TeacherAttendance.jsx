import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Có mặt', pillClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'absent', label: 'Vắng', pillClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'late', label: 'Muộn', pillClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'excused', label: 'Có phép', pillClass: 'bg-blue-100 text-primary dark:bg-primary/20 dark:text-primary' },
];

export default function TeacherAttendance() {
  const { sessionId } = useParams();
  const [attendance, setAttendance] = useState({});
  const [students, setStudents] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      teacherApi.getSessionAttendance(sessionId),
      teacherApi.getSessionById(sessionId),
    ])
      .then(([attRes, sessRes]) => {
        if (attRes.success && attRes.data) {
          const list = attRes.data;
          setStudents(list);
          const init = {};
          list.forEach((item) => {
            const id = item.student?._id;
            if (id) {
              init[id] = {
                status: item.status || 'present',
                notes: item.notes || '',
              };
            }
          });
          setAttendance(init);
        }
        if (sessRes.success && sessRes.data) setSession(sessRes.data);
      })
      .catch((err) => setError(err.message || 'Tải dữ liệu thất bại'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNotesChange = (studentId, notes) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const handleMarkAllPresent = () => {
    const next = {};
    Object.keys(attendance).forEach((id) => {
      next[id] = { ...attendance[id], status: 'present' };
    });
    setAttendance(next);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    const attendanceList = Object.entries(attendance).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      notes: data.notes || '',
    }));
    teacherApi
      .bulkMarkAttendance(sessionId, attendanceList)
      .then(() => alert('Điểm danh thành công!'))
      .catch((err) => setError(err.message || 'Lưu thất bại'))
      .finally(() => setSaving(false));
  };

  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  Object.values(attendance).forEach((d) => {
    if (d.status) counts[d.status] = (counts[d.status] || 0) + 1;
  });

  if (loading) return <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[#617589] dark:text-gray-400">
        <Link to="/teacher/timetable" className="hover:text-primary flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">home</span>
          Lịch dạy
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-[#111418] dark:text-white font-medium">
          {session?.class?.name || 'Lớp'} • Điểm danh
        </span>
      </nav>

      {/* Header: title + session details */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111418] dark:text-white">
            {session?.class?.name || session?.title || `Buổi ${session?.sessionNumber}`}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#617589] dark:text-gray-400">
            {session?.date && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                {new Date(session.date).toLocaleDateString('vi-VN')}
              </span>
            )}
            {session?.startTime && session?.endTime && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">schedule</span>
                {session.startTime} - {session.endTime}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <span className="material-symbols-outlined text-lg">cloud_done</span>
            Đã lưu
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Student Attendance List card */}
      <div className="bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex flex-wrap justify-between items-center gap-3 border-b border-[#f0f2f4] dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#111418] dark:text-white">Danh sách điểm danh</h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {students.length} học sinh
            </span>
          </div>
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="flex items-center gap-2 rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold hover:opacity-90"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Đánh dấu tất cả có mặt
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f6f7f8] dark:bg-gray-800/80">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                  Học sinh
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((item) => {
                const s = item.student;
                if (!s) return null;
                const id = s._id;
                const data = attendance[id] || { status: 'present', notes: '' };
                return (
                  <tr key={id} className="border-t border-[#f0f2f4] dark:border-gray-800">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#111418] dark:text-white">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-[#617589] dark:text-gray-400">{s.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ATTENDANCE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleStatusChange(id, opt.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              data.status === opt.value
                                ? opt.pillClass
                                : 'bg-[#f0f2f4] dark:bg-gray-700 text-[#617589] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={data.notes}
                        onChange={(e) => handleNotesChange(id, e.target.value)}
                        placeholder="Thêm ghi chú..."
                        className="w-full max-w-xs bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm text-[#111418] dark:text-white placeholder:text-[#617589] focus:ring-2 focus:ring-primary/50"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom: summary + actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Có mặt: <strong className="text-[#111418] dark:text-white">{counts.present}</strong>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Vắng: <strong className="text-[#111418] dark:text-white">{counts.absent}</strong>
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Muộn: <strong className="text-[#111418] dark:text-white">{counts.late}</strong>
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
          </button>
        </div>
      </div>
    </div>
  );
}
