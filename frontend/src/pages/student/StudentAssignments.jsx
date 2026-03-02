import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

const STATUS_PILL = {
  Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Submitted: 'bg-blue-100 text-primary dark:bg-primary/20 dark:text-primary',
  Graded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function getStatus(submission) {
  if (!submission) return 'Pending';
  if (submission.status === 'graded') return 'Graded';
  return 'Submitted';
}

export default function StudentAssignments() {
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId');
  const [assignments, setAssignments] = useState([]);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'completed'

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      let list = [];
      if (classId) {
        const res = await studentApi.getClassAssignments(classId);
        if (res.success && res.data) list = Array.isArray(res.data) ? res.data : [];
      } else {
        const res = await studentApi.getClasses();
        if (res.success && res.data) {
          const cls = res.data.classes || res.data || [];
          setClasses(cls);
          if (cls.length > 0) {
            const results = await Promise.all(cls.map((c) => studentApi.getClassAssignments(c._id)));
            list = results.flatMap((r) => (r.success && r.data ? (Array.isArray(r.data) ? r.data : []) : []));
          }
        }
      }
      setAssignments(list);
      const subRes = await studentApi.getMySubmissions({ limit: 200 });
      const map = {};
      if (subRes.success && subRes.data) {
        const subs = subRes.data.submissions || (Array.isArray(subRes.data) ? subRes.data : []);
        subs.forEach((s) => {
          const aid = s.assignment?._id;
          if (aid) map[aid] = s;
        });
      }
      setSubmissionsByAssignment(map);
    } catch (err) {
      setError(err.message || 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [classId]);

  const now = new Date();
  const upcoming = assignments.filter((a) => {
    const due = a.dueDate ? new Date(a.dueDate) : null;
    const sub = submissionsByAssignment[a._id];
    return !sub || sub.status !== 'graded' ? (due ? due >= now : true) : false;
  });
  const completed = assignments.filter((a) => {
    const sub = submissionsByAssignment[a._id];
    return sub && (sub.status === 'submitted' || sub.status === 'graded');
  });
  const activeCount = upcoming.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-end gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">Bài tập</h1>
          <p className="text-[#617589] dark:text-gray-400">
            Bạn có <span className="text-primary font-bold">{activeCount} bài đang làm</span> trong tuần này.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg h-10 px-4 bg-[#f0f2f4] dark:bg-[#1e293b] text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">sync</span>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#e5e7eb] dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-[#617589] dark:text-gray-400 hover:text-[#111418] dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">schedule</span>
          Sắp đến
          {activeCount > 0 && (
            <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            tab === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-[#617589] dark:text-gray-400 hover:text-[#111418] dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">done_all</span>
          Đã hoàn thành
          {completed.length > 0 && (
            <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#f0f2f4] dark:bg-gray-700 text-[#617589] dark:text-gray-400 text-xs flex items-center justify-center">
              {completed.length}
            </span>
          )}
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
        <div className="bg-white dark:bg-[#1a242f] rounded-xl border border-[#f0f2f4] dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f7f8] dark:bg-gray-800/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                    Bài tập
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                    Lớp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                    Hạn nộp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#617589] dark:text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {(tab === 'upcoming' ? upcoming : completed).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[#617589] dark:text-gray-400">
                      {tab === 'upcoming' ? 'Không có bài sắp đến.' : 'Chưa có bài hoàn thành.'}
                    </td>
                  </tr>
                ) : (
                  (tab === 'upcoming' ? upcoming : completed).map((a) => {
                    const sub = submissionsByAssignment[a._id];
                    const status = getStatus(sub);
                    const dueStr = a.dueDate ? new Date(a.dueDate).toLocaleDateString('vi-VN') : '-';
                    const isUrgent = a.dueDate && new Date(a.dueDate) < new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    return (
                      <tr
                        key={a._id}
                        className="border-t border-[#f0f2f4] dark:border-gray-800 hover:bg-[#f6f7f8]/50 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-[#111418] dark:text-white">{a.title}</p>
                          {a.description && (
                            <p className="text-xs text-[#617589] dark:text-gray-400 mt-0.5 line-clamp-2">
                              {a.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[#617589] dark:text-gray-400">{a.class?.name || '-'}</td>
                        <td className="px-4 py-4">
                          <span className={isUrgent ? 'text-red-600 dark:text-red-400' : ''}>{dueStr}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_PILL[status] || STATUS_PILL.Pending}`}
                          >
                            {status === 'Pending' && 'Chờ nộp'}
                            {status === 'Submitted' && 'Đã nộp'}
                            {status === 'Graded' && 'Đã chấm'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {status === 'Pending' ? (
                            <Link
                              to={`/student/assignments/${a._id}/submit`}
                              className="inline-flex items-center gap-1.5 rounded-lg h-8 px-3 bg-primary text-white text-sm font-bold hover:opacity-90"
                            >
                              <span className="material-symbols-outlined text-base">upload</span>
                              Nộp bài
                            </Link>
                          ) : (
                            <Link
                              to={`/student/assignments/${a._id}/submit`}
                              className="text-primary font-bold text-sm hover:underline"
                            >
                              Xem chi tiết
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
