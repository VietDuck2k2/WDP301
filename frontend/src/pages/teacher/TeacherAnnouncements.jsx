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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Thông báo</h1>
          <p className="text-[#617589] dark:text-gray-400">Gửi và quản lý thông báo theo lớp.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {showForm ? 'Đóng' : 'Tạo thông báo'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 bg-white dark:bg-[#1a242f] border border-[#f0f2f4] dark:border-gray-800 rounded-xl"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-1.5">Lớp</label>
              <select
                value={form.class}
                onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-4 h-10 text-sm text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
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
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-1.5">Tiêu đề</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-4 h-10 text-sm text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-1.5">Nội dung</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                className="w-full bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-1.5">Độ ưu tiên</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="bg-[#f0f2f4] dark:bg-gray-800 border-none rounded-lg px-4 h-10 text-sm text-[#111418] dark:text-white focus:ring-2 focus:ring-primary/50"
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
              className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 w-fit"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              {submitting ? 'Đang tạo...' : 'Tạo thông báo'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-[#617589] dark:text-gray-400">Đang tải...</p>
      ) : (
        <div className="flex flex-col gap-4">
          {announcements.length === 0 ? (
            <p className="text-[#617589] dark:text-gray-400">Chưa có thông báo.</p>
          ) : (
            announcements.map((a) => (
              <div
                key={a._id}
                className={`p-5 rounded-xl border ${
                  a.isPinned
                    ? 'border-primary/40 bg-primary/5 dark:bg-primary/10 dark:border-primary/30'
                    : 'bg-white dark:bg-[#1a242f] border-[#f0f2f4] dark:border-gray-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#111418] dark:text-white flex items-center gap-2">
                      {a.isPinned && <span className="material-symbols-outlined text-primary">push_pin</span>}
                      {a.title}
                    </h3>
                    <p className="text-sm text-[#617589] dark:text-gray-400 mt-1">
                      {a.class?.name} • {new Date(a.createdAt).toLocaleString('vi-VN')}
                    </p>
                    <p className="mt-2 text-[#111418] dark:text-gray-300">{a.content}</p>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded-lg text-xs font-medium ${
                        a.priority === 'urgent'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : a.priority === 'high'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-[#617589] dark:text-gray-400'
                      }`}
                    >
                      {PRIORITY_LABELS[a.priority] || a.priority}
                    </span>
                  </div>
                  <button
                    onClick={() => handleTogglePin(a._id)}
                    className="text-sm font-bold text-primary hover:underline"
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
