import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

export default function TeacherSessions() {
  const { classId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const [sessRes, clsRes] = await Promise.all([
          teacherApi.getSessions(classId),
          classId ? teacherApi.getClasses() : null,
        ]);
        if (sessRes.success && sessRes.data) {
          const d = sessRes.data;
          setSessions(Array.isArray(d) ? d : d.sessions || []);
        }
        if (clsRes?.success && clsRes?.data && classId) {
          const classes = clsRes.data.classes || clsRes.data || [];
          const cls = classes.find((c) => c._id === classId);
          if (cls) setClassInfo(cls);
        }
      } catch (err) {
        setError(err.message || 'Tải dữ liệu thất bại');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">
          Buổi học {classInfo?.name ? `- ${classInfo.name}` : ''}
        </h1>
        <p className="text-[#617589] dark:text-gray-400">Danh sách buổi học và điểm danh.</p>
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
            <p className="text-[#617589] dark:text-gray-400">Chưa có buổi học.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s._id}
                className="p-5 bg-white dark:bg-[#1a242f] border border-[#f0f2f4] dark:border-gray-800 rounded-xl flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-[#111418] dark:text-white">{s.title || `Buổi ${s.sessionNumber}`}</h3>
                  <p className="text-sm text-[#617589] dark:text-gray-400">
                    {new Date(s.date).toLocaleDateString('vi-VN')} • {s.startTime} - {s.endTime} • {s.room || '-'}
                  </p>
                  {s.notes && (
                    <p className="text-xs text-[#617589] dark:text-gray-400 mt-1">{s.notes}</p>
                  )}
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
