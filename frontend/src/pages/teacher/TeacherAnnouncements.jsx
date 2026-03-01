import { useState, useEffect } from 'react';
import { teacherApi } from '../../api/teacherApi';

const PRIORITY_LABELS = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export default function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class: '', title: '', content: '', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    teacherApi
      .getAnnouncements()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setAnnouncements(d.announcements || []);
        }
      })
      .catch((err) => setError(err.message || 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    teacherApi.getClasses().then((res) => {
      if (res.success && res.data) {
        const d = res.data;
        setClasses(d.classes || d || []);
      }
    });
  }, []);

  const handleTogglePin = async (id) => {
    try {
      await teacherApi.togglePinAnnouncement(id);
      setAnnouncements((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, isPinned: !a.isPinned } : a
        )
      );
    } catch (err) {
      alert(err.message || 'Thất bại');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await teacherApi.createAnnouncement(form);
      setForm({ class: '', title: '', content: '', priority: 'normal' });
      setShowForm(false);
      const res = await teacherApi.getAnnouncements();
      if (res.success && res.data) {
        setAnnouncements(res.data.announcements || []);
      }
    } catch (err) {
      alert(err.message || 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Đóng' : 'Tạo thông báo'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 p-4 bg-white border rounded-lg shadow-sm"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Lớp</label>
              <select
                value={form.class}
                onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Chọn lớp</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tiêu đề</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nội dung</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="w-full border rounded px-3 py-2"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="border rounded px-3 py-2"
              >
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo thông báo'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <p className="text-gray-500">Chưa có thông báo.</p>
          ) : (
            announcements.map((a) => (
              <div
                key={a._id}
                className={`p-4 border rounded-lg ${
                  a.isPinned ? 'border-blue-300 bg-blue-50' : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {a.isPinned && <span className="text-blue-600">📌</span>}
                      {a.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {a.class?.name} • {new Date(a.createdAt).toLocaleString('vi-VN')}
                    </p>
                    <p className="mt-2 text-gray-700">{a.content}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${
                        a.priority === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : a.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {PRIORITY_LABELS[a.priority] || a.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => handleTogglePin(a._id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {a.isPinned ? 'Bỏ ghim' : 'Ghim'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
