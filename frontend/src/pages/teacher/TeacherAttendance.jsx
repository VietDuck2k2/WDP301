import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

const ATTENDANCE_STATUS = [
  { value: 'present', label: 'Có mặt', color: 'green' },
  { value: 'absent', label: 'Vắng', color: 'red' },
  { value: 'late', label: 'Muộn', color: 'yellow' },
  { value: 'excused', label: 'Có phép', color: 'blue' },
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
        if (sessRes.success && sessRes.data) {
          setSession(sessRes.data);
        }
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
      .then(() => {
        alert('Điểm danh thành công!');
      })
      .catch((err) => setError(err.message || 'Lưu thất bại'))
      .finally(() => setSaving(false));
  };

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Điểm danh</h1>
      {session && (
        <p className="text-gray-600 mb-4">
          {session.title || `Session ${session.sessionNumber}`} • {session.class?.name} •{' '}
          {new Date(session.date).toLocaleDateString('vi-VN')}
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-medium">Học sinh</th>
              <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-left font-medium">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {students.map((item) => {
              const s = item.student;
              if (!s) return null;
              const id = s._id;
              const data = attendance[id] || { status: 'present', notes: '' };
              return (
                <tr key={id} className="border-t">
                  <td className="px-4 py-3">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={data.status}
                      onChange={(e) => handleStatusChange(id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {ATTENDANCE_STATUS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={data.notes}
                      onChange={(e) => handleNotesChange(id, e.target.value)}
                      placeholder="Ghi chú..."
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
      </button>
    </div>
  );
}
