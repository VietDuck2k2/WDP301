import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import FileUpload from '../../components/FileUpload';

const formatDate = (d) => d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class: '', title: '', description: '', instructions: '', dueDate: '', closeDate: '', maxScore: 100, assignmentType: 'homework', allowLateSubmission: false, attachments: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    teacherApi.getMyClasses().then((res) => {
      if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    teacherApi.getAssignments(classId ? { classId } : {})
      .then((res) => {
        if (res?.success && res.data) setAssignments(Array.isArray(res.data) ? res.data : (res.data.assignments || []));
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [classId]);

  const handleCreate = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    teacherApi.createAssignment({
      class: form.class,
      title: form.title,
      description: form.description,
      instructions: form.instructions,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
      closeDate: form.closeDate ? new Date(form.closeDate).toISOString() : undefined,
      maxScore: Number(form.maxScore) || 100,
      assignmentType: form.assignmentType || 'homework',
      allowLateSubmission: form.allowLateSubmission,
      attachments: form.attachments,
    })
      .then((res) => {
        if (res?.success && res.data) {
          setAssignments((prev) => [res.data, ...prev]);
          setShowForm(false);
          setForm({ class: '', title: '', description: '', instructions: '', dueDate: '', closeDate: '', maxScore: 100, assignmentType: 'homework', allowLateSubmission: false, attachments: [] });
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo bài tập.'))
      .finally(() => setSubmitting(false));
  };

   const handleClose = async (assignmentId) => {
    if (!confirm('Đóng bài tập? Học sinh sẽ không thể nộp thêm.')) return;
    try {
      const res = await teacherApi.closeAssignment(assignmentId);
      if (res?.success) setAssignments((prev) => prev.map((a) => a._id === assignmentId ? { ...a, status: 'closed' } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể đóng bài tập.');
    }
  };

  const handlePublish = async (assignmentId) => {
    if (!confirm('Công khai bài tập này? Học sinh có thể bắt đầu thấy và nộp bài.')) return;
    try {
      const res = await teacherApi.publishAssignment(assignmentId);
      if (res?.success) setAssignments((prev) => prev.map((a) => a._id === assignmentId ? { ...a, status: 'published' } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể công khai bài tập.');
    }
  };

  const getStatusBadge = (status, dueDate) => {
      const now = new Date();
      const due = new Date(dueDate);
      const isOverdue = dueDate && now > due;
      if (status === 'draft') return <span className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30">Lưu nháp</span>;
      if (status === 'closed' || status === 'archived') return <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-200">{status === 'archived' ? 'Lưu trữ' : 'Đã đóng'}</span>;
      if (isOverdue) return <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-200">Đã hết hạn</span>;
      return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Đang mở</span>;
  };

  // Auto-set closeDate = dueDate + 1 day when dueDate changes
  const handleDueDateChange = (val) => {
    setForm((f) => {
      let newClose = f.closeDate;
      if (val && (!newClose || newClose <= val)) {
        const d = new Date(val);
        d.setDate(d.getDate() + 1);
        newClose = d.toISOString().slice(0, 16);
      }
      return { ...f, dueDate: val, closeDate: newClose };
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Quản lý Bài tập</h1>
          <p className="text-on-surface-variant font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">assignment</span>
            Tạo và chấm điểm bài tập cho các lớp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70 pointer-events-none text-[20px]">filter_list</span>
            <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-surface border border-outline-variant/50 text-on-surface text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
            >
              <option value="">Tất cả các lớp</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-container transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:-translate-y-0.5"
            onClick={() => setShowForm(!showForm)}
          >
            <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add_task'}</span>
            {showForm ? 'Hủy tạo' : 'Tạo Bài tập mới'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-xl flex items-center gap-3 border border-red-200 shadow-sm animate-in slide-in-from-top-2">
            <span className="material-symbols-outlined">error</span>
            <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-[0_12px_40px_rgba(0,0,0,0.06)] mb-10 relative overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-extrabold font-headline text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">edit_document</span>
                        Tạo bài tập mới
                    </h3>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Lớp học giao bài <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={form.class}
                                    onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                                >
                                    <option value="" disabled>-- Chọn lớp học --</option>
                                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Tiêu đề bài tập <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    placeholder="Vd: Bài tập về nhà Unit 1 - Present Simple"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Loại bài tập</label>
                                <select
                                    value={form.assignmentType}
                                    onChange={(e) => setForm((f) => ({ ...f, assignmentType: e.target.value }))}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                                >
                                    {['homework','writing','speaking','vocabulary','quiz','midterm','final'].map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Thời hạn nộp bài <span className="text-red-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={form.dueDate}
                                    onChange={(e) => handleDueDateChange(e.target.value)}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">
                                    Thời điểm đóng nhận bài
                                    <span className="ml-1 font-normal text-on-surface-variant/60 text-xs">(tự động = hạn nộp + 1 ngày)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    value={form.closeDate}
                                    onChange={(e) => setForm((f) => ({ ...f, closeDate: e.target.value }))}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Thang điểm tối đa</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="100"
                                    value={form.maxScore}
                                    onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/40">
                                <input
                                    type="checkbox"
                                    id="allowLate"
                                    checked={form.allowLateSubmission}
                                    onChange={(e) => setForm((f) => ({ ...f, allowLateSubmission: e.target.checked }))}
                                    className="w-4 h-4 accent-amber-500"
                                />
                                <label htmlFor="allowLate" className="text-sm font-bold text-amber-800 cursor-pointer">
                                    Cho phép nộp muộn sau hạn (nhưng trước closeDate)
                                </label>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Mô tả và Yêu cầu</label>
                                <textarea
                                    placeholder="Nhập nội dung chi tiết bài tập..."
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40 min-h-[120px] resize-y"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Định dạng nộp bài (Hướng dẫn)</label>
                                <input
                                    placeholder="Vd: Nộp file PDF hoặc Docx"
                                    value={form.instructions}
                                    onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Tài liệu đính kèm</label>
                                <FileUpload
                                    value={form.attachments}
                                    onChange={(att) => setForm((f) => ({ ...f, attachments: att }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/20">
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold min-w-[120px] hover:bg-primary-container transition-all shadow-sm shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Đang tạo...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">send</span> Tạo Bài tập</>
                            )}
                        </button>
                        <button
                            type="button"
                            className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                            onClick={() => setShowForm(false)}
                        >
                            Hủy bỏ
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Đang tải dữ liệu...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 flex flex-col items-center justify-center py-32 px-4 shadow-sm text-center">
            <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">inventory_2</span>
            <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Chưa có bài tập nào</h3>
            <p className="text-on-surface-variant max-w-md mx-auto mb-6">Bạn chưa tạo bài tập nào cho lớp này. Hãy tạo bài tập đầu tiên để học viên có thể vào làm bài.</p>
            <button
                onClick={() => setShowForm(true)}
                className="bg-primary/10 text-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">add</span> Tạo ngay
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {assignments.map((a) => (
                <div key={a._id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">{a.class?.name || 'Không rõ lớp'}</span>
                            <h3 className="font-headline font-bold text-lg text-on-surface line-clamp-2 leading-tight group-hover:text-primary transition-colors">{a.title}</h3>
                        </div>
                        <div className="shrink-0 pt-1">
                            {getStatusBadge(a.status, a.dueDate)}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 flex-grow flex flex-col gap-5">
                        <p className="text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
                            {a.description || <span className="opacity-50 italic">Không có mô tả...</span>}
                        </p>

                        <div className="bg-surface-container-low/50 rounded-xl p-4 mt-auto space-y-3 border border-outline-variant/20">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">event</span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant font-headline">Hạn nộp bài</p>
                                    <p className="font-bold text-on-surface">{formatDate(a.dueDate)}</p>
                                </div>
                            </div>

                            {a.closeDate && (
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-[18px]">lock</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant font-headline">Đóng nhận bài</p>
                                        <p className="font-bold text-on-surface">{formatDate(a.closeDate)}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant font-headline">Điểm tối đa</p>
                                    <p className="font-bold text-on-surface">{a.maxScore} điểm</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-surface-container/30 border-t border-outline-variant/10 flex justify-between items-center mt-auto">
                        <div className="text-xs font-medium text-on-surface-variant flex items-center gap-1.5 opacity-70">
                            <span className="material-symbols-outlined text-[14px]">upload_file</span>
                            {a.attachments?.length || 0} tệp
                        </div>
                        <div className="flex items-center gap-2">
                            {a.status === 'draft' && (
                                <button
                                    onClick={() => handlePublish(a._id)}
                                    title="Công khai bài tập"
                                    className="bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">publish</span>
                                    Công khai
                                </button>
                            )}
                            {a.status === 'published' && (
                                <button
                                    onClick={() => handleClose(a._id)}
                                    title="Đóng bài tập"
                                    className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[16px]">lock</span>
                                </button>
                            )}
                            <Link
                                to={`/teacher/assignments/${a._id}`}
                                className="bg-surface border border-outline-variant/50 text-primary px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:border-primary/50 hover:bg-primary/5 transition-all inline-flex items-center gap-1.5 group-hover:bg-primary group-hover:text-white"
                            >
                                Chấm bài
                                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}
