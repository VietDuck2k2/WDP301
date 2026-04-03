import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const TYPE_LABELS = { homework: 'Bài tập', writing: 'Viết', speaking: 'Nói', vocabulary: 'Từ vựng', quiz: 'Kiểm tra', midterm: 'Giữa kỳ', final: 'Cuối kỳ' };

const STATUS_BADGE = {
  none:      { label: 'Chưa nộp',  cls: 'bg-surface-container text-on-surface-variant border-outline-variant/30' },
  draft:     { label: 'Nháp',      cls: 'bg-surface-container text-on-surface-variant border-outline-variant/30' },
  submitted: { label: 'Đã nộp',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  returned:  { label: 'Trả lại',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  graded:    { label: 'Đã chấm',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  missing:   { label: 'Thiếu bài', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const BORDER_COLOR = {
  none: 'border-l-4 border-l-outline-variant/30',
  draft: 'border-l-4 border-l-outline-variant/30',
  submitted: 'border-l-4 border-l-blue-400',
  returned: 'border-l-4 border-l-amber-400',
  graded: 'border-l-4 border-l-emerald-400',
  missing: 'border-l-4 border-l-red-400',
};

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'none', label: 'Chưa nộp' },
  { key: 'submitted', label: 'Đã nộp' },
  { key: 'graded', label: 'Đã chấm' },
  { key: 'returned', label: 'Trả lại' },
  { key: 'missing', label: 'Thiếu bài' },
];

export default function StudentAssignments() {
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(classIdParam || '');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    studentApi.getClasses().then((res) => {
      if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchAll = (ids) =>
      Promise.all(ids.map((id) => studentApi.getClassAssignments(id)))
        .then((results) => results.flatMap((res) => (res?.success && res.data ? (Array.isArray(res.data) ? res.data : []) : [])))
        .catch(() => [])
        .finally(() => setLoading(false));

    if (classId) {
      studentApi.getClassAssignments(classId)
        .then((res) => setAssignments(res?.success && res.data ? (Array.isArray(res.data) ? res.data : []) : []))
        .catch(() => setAssignments([]))
        .finally(() => setLoading(false));
    } else if (classes.length > 0) {
      fetchAll(classes.map((c) => c._id)).then(setAssignments);
    } else {
      setAssignments([]);
      setLoading(false);
    }
  }, [classId, classes]);

  const filtered = activeTab === 'all'
    ? assignments
    : assignments.filter((a) => (a.submissionStatus || 'none') === activeTab);

  const counts = FILTER_TABS.reduce((acc, t) => {
    acc[t.key] = t.key === 'all' ? assignments.length : assignments.filter((a) => (a.submissionStatus || 'none') === t.key).length;
    return acc;
  }, {});

  const now = new Date();

  return (
    <div className="max-w-[1400px] mx-auto fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Bài tập của tôi</h1>
          <p className="text-on-surface-variant font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            Theo dõi và nộp bài tập đúng hạn
          </p>
        </div>
        <div className="min-w-[200px]">
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full bg-surface border border-outline-variant/50 text-on-surface text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">Tất cả các lớp</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'Tổng', val: counts.all, color: 'bg-primary/10 text-primary' },
          { label: 'Thiếu bài', val: counts.missing, color: 'bg-red-50 text-red-700' },
          { label: 'Đã nộp', val: counts.submitted, color: 'bg-blue-50 text-blue-700' },
          { label: 'Đã chấm', val: counts.graded, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Trả lại', val: counts.returned, color: 'bg-amber-50 text-amber-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`${color} rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-bold`}>
            <span>{val}</span><span className="opacity-70 font-normal">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${
              activeTab === t.key
                ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary'
            }`}
          >
            {t.label} {counts[t.key] > 0 && <span className="ml-1 opacity-70">({counts[t.key]})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Đang tải dữ liệu...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/20 flex flex-col items-center justify-center py-28 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-primary/20 mb-4">assignment</span>
          <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Không có bài tập nào</h3>
          <p className="text-on-surface-variant">Chưa có bài tập phù hợp với bộ lọc này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((a) => {
            const subStatus = a.submissionStatus || 'none';
            const badge = STATUS_BADGE[subStatus] || STATUS_BADGE.none;
            const sub = a.submission;
            const typeClosed = a.status === 'closed' || (a.closeDate && now > new Date(a.closeDate));
            const isOverdueOnly = now > new Date(a.dueDate) && !typeClosed;

            return (
              <div key={a._id} className={`bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,55,176,0.06)] hover:shadow-[0_8px_30px_rgba(0,55,176,0.1)] transition-all flex flex-col ${BORDER_COLOR[subStatus]}`}>
                {/* Card header */}
                <div className="px-5 pt-5 pb-3 flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${badge.cls}`}>{badge.label}</span>
                      {a.assignmentType && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-secondary-container/40 text-on-secondary-container border border-secondary-container/30">
                          {TYPE_LABELS[a.assignmentType] || a.assignmentType}
                        </span>
                      )}
                      {sub?.isLate && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Nộp muộn</span>}
                      {sub?.isResubmission && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Lần {sub.attemptNo}</span>}
                      {typeClosed && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/30">Đã đóng</span>}
                    </div>
                    <h3 className="font-headline font-bold text-base text-on-surface line-clamp-2 leading-tight">{a.title}</h3>
                  </div>
                  {subStatus === 'graded' && sub?.score != null && (
                    <div className="shrink-0 text-right">
                      <span className="text-2xl font-extrabold text-emerald-600">{sub.score}</span>
                      <span className="text-xs text-on-surface-variant font-bold">/{a.maxScore}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {a.description && (
                  <p className="px-5 pb-3 text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{a.description}</p>
                )}

                {/* Returned banner */}
                {subStatus === 'returned' && sub?.returnReason && (
                  <div className="mx-5 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex gap-2 items-start">
                    <span className="material-symbols-outlined text-amber-600 text-[18px] mt-0.5 shrink-0">undo</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800 mb-0.5">Giáo viên trả lại để sửa</p>
                      <p className="text-xs text-amber-700 leading-relaxed">{sub.returnReason}</p>
                    </div>
                  </div>
                )}

                {/* Missing banner */}
                {subStatus === 'missing' && (
                  <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex gap-2 items-center">
                    <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0">warning</span>
                    <p className="text-xs font-bold text-red-700">Quá hạn — Chưa nộp bài</p>
                  </div>
                )}

                {/* Score bar for graded */}
                {subStatus === 'graded' && sub?.score != null && (
                  <div className="mx-5 mb-3">
                    <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (sub.score / a.maxScore) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="mx-5 mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-red-500">event</span>
                    <span>Hạn nộp: <strong className={`${isOverdueOnly ? 'text-red-600' : 'text-on-surface'}`}>{formatDate(a.dueDate)}</strong></span>
                  </div>
                  {a.closeDate && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-outline">lock</span>
                      <span>Đóng: <strong className="text-on-surface">{formatDate(a.closeDate)}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-amber-500">grade</span>
                    <span>Điểm tối đa: <strong className="text-on-surface">{a.maxScore}</strong></span>
                  </div>
                  {a.allowLateSubmission && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-amber-500">schedule_send</span>
                      <span className="text-amber-700 font-bold">Cho phép nộp muộn</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-5 py-3 mt-auto border-t border-outline-variant/10 flex justify-end gap-2">
                  {(subStatus === 'graded' || subStatus === 'submitted') && (
                    <Link
                      to={`/student/assignments/${a._id}/submit`}
                      className="text-xs font-bold text-primary hover:text-primary-container px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      Xem kết quả
                    </Link>
                  )}
                  {subStatus === 'returned' && !typeClosed && (
                    <Link
                      to={`/student/assignments/${a._id}/submit`}
                      className="inline-flex items-center gap-1.5 bg-amber-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px]">undo</span>
                      Nộp lại
                    </Link>
                  )}
                  {['none', 'draft', 'missing'].includes(subStatus) && !typeClosed && (
                    <Link
                      to={`/student/assignments/${a._id}/submit`}
                      className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-primary-container transition-colors shadow-sm shadow-primary/20"
                    >
                      <span className="material-symbols-outlined text-[14px]">upload_file</span>
                      Nộp bài
                    </Link>
                  )}
                  {typeClosed && subStatus === 'none' && (
                    <span className="text-xs text-on-surface-variant font-bold opacity-60 px-3 py-1.5">Đã đóng nhận bài</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
