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
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Buổi học {classInfo?.name ? `- ${classInfo.name}` : ''}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-500">Chưa có buổi học.</p>
          ) : (
            sessions.map((s) => (
              <div
                key={s._id}
                className="p-4 bg-white border rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold">{s.title || `Session ${s.sessionNumber}`}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(s.date).toLocaleDateString('vi-VN')} • {s.startTime} - {s.endTime} • {s.room || '-'}
                  </p>
                  {s.notes && (
                    <p className="text-xs text-gray-600 mt-1">{s.notes}</p>
                  )}
                </div>
                <Link
                  to={`/teacher/sessions/${s._id}/attendance`}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
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
