import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../api/teacherApi';
import FileUpload from '../../components/FileUpload';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');
const PRIORITY_LABEL = { low: 'Thấp', normal: 'Bình thường', high: 'Cao', urgent: 'Khẩn cấp' };

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-50 text-red-700 border-red-200';
    case 'high': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'normal':
    default: return 'bg-surface-container text-on-surface-variant border-outline-variant/30';
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'urgent': return 'priority_high';
    case 'high': return 'trending_up';
    case 'low': return 'trending_down';
    case 'normal':
    default: return 'horizontal_rule';
  }
};

export default function TeacherAnnouncements() {
  const [list, setList] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ class: '', title: '', content: '', priority: 'normal', attachments: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filtering state
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    teacherApi.getMyClasses().then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    teacherApi.getAnnouncements()
      .then((res) => { if (res?.success && res.data) setList(Array.isArray(res.data) ? res.data : []); })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    teacherApi.createAnnouncement({ class: form.class, title: form.title, content: form.content, priority: form.priority, attachments: form.attachments })
      .then((res) => {
        if (res?.success) { 
            setShowForm(false); 
            setForm({ class: '', title: '', content: '', priority: 'normal', attachments: [] }); 
            setList((prev) => [res.data, ...prev]); 
            alert('Đăng thông báo thành công!');
        }
        else setError(res?.message || 'Tạo thất bại');
      })
      .catch((err) => setError(err.response?.data?.message || 'Tạo thất bại'))
      .finally(() => setSubmitting(false));
  };

  const togglePin = (id) => {
    teacherApi.toggleAnnouncementPin(id).then((res) => { 
        if (res?.success && res.data) {
            setList((prev) => {
                const updatedList = prev.map((a) => (a._id === id ? res.data : a));
                // Sort to keep pinned at top
                return updatedList.sort((a, b) => {
                    if (a.isPinned === b.isPinned) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return a.isPinned ? -1 : 1;
                });
            });
        } 
    });
  };

  const filteredList = filterClass ? list.filter(a => a.class?._id === filterClass) : list;

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Quản lý Thông báo</h1>
          <p className="text-on-surface-variant font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            Gửi tin tức, tài liệu và nhắc nhở đến các lớp học
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-70 pointer-events-none text-[20px]">filter_list</span>
            <select 
                value={filterClass} 
                onChange={(e) => setFilterClass(e.target.value)} 
                className="w-full bg-surface border border-outline-variant/50 text-on-surface text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer shadow-sm"
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
            <span className="material-symbols-outlined text-[18px]">{showForm ? 'close' : 'add_alert'}</span>
            {showForm ? 'Hủy tạo' : 'Đăng Thông báo'}
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
                        <span className="material-symbols-outlined text-primary">edit_square</span>
                        Soạn thông báo mới
                    </h3>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Lớp nhận thông báo <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Tiêu đề thông báo <span className="text-red-500">*</span></label>
                                <input 
                                    required 
                                    placeholder="Vd: Nghỉ học ngày 20/11..." 
                                    value={form.title} 
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Mức độ ưu tiên</label>
                                <select 
                                    value={form.priority} 
                                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} 
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface"
                                >
                                    {Object.entries(PRIORITY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-5 flex flex-col">
                            <div className="flex-grow flex flex-col">
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Nội dung chi tiết <span className="text-red-500">*</span></label>
                                <textarea 
                                    required
                                    placeholder="Nhập nội dung thông báo muốn truyền đạt..." 
                                    value={form.content} 
                                    onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} 
                                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-on-surface-variant/40 flex-grow resize-y min-h-[140px]" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-on-surface-variant mb-1.5 ml-1">Tài liệu đính kèm (Tuỳ chọn)</label>
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
                                <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> Đang đăng...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[18px]">send</span> Đăng Thông báo</>
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
          <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Đang tải thông báo...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 flex flex-col items-center justify-center py-32 px-4 shadow-sm text-center">
            <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">campaign</span>
            <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">Chưa có thông báo nào</h3>
            <p className="text-on-surface-variant max-w-md mx-auto mb-6">Danh sách thông báo hiện đang trống. Hãy tạo thông báo mới để gửi thông tin đến học viên.</p>
            <button 
                onClick={() => setShowForm(true)}
                className="bg-primary/10 text-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary/20 transition-colors inline-flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">add_alert</span> Tạo ngay
            </button>
        </div>
      ) : (
        <div className="space-y-4">
            {filteredList.map((a) => {
                const isPinned = a.isPinned;
                return (
                    <div 
                        key={a._id} 
                        className={`bg-surface-container-lowest rounded-2xl p-6 transition-all group relative overflow-hidden flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md ${isPinned ? 'border-2 border-amber-400 ring-4 ring-amber-400/10' : 'border border-outline-variant/40'}`}
                    >
                        {isPinned && (
                            <div className="absolute top-0 right-0">
                                <div className="bg-amber-400 text-amber-950 text-[10px] font-bold uppercase tracking-widest px-8 py-1 pb-1 transform translate-x-7 -translate-y-0 rotate-45 shadow-sm origin-bottom-left flex items-center justify-center">
                                    Đã Ghim
                                </div>
                            </div>
                        )}
                        
                        <div className="flex-1 space-y-4 pr-0 md:pr-10">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border ${getPriorityColor(a.priority)}`}>
                                        <span className="material-symbols-outlined text-[14px]">
                                            {getPriorityIcon(a.priority)}
                                        </span>
                                        {PRIORITY_LABEL[a.priority] || a.priority}
                                    </span>
                                    
                                    <span className="px-2 py-0.5 rounded flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-surface-container text-on-surface-variant border border-outline-variant/30">
                                        <span className="material-symbols-outlined text-[14px]">school</span>
                                        {a.class?.name || 'Tất cả các lớp'}
                                    </span>
                                    
                                    <span className="px-2 py-0.5 rounded flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                        {formatDate(a.createdAt)}
                                    </span>
                                </div>
                                
                                <h3 className="font-headline font-extrabold text-xl text-on-surface mb-2 pr-6 leading-tight">{a.title}</h3>
                                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap opacity-90">{a.content}</p>
                            </div>
                            
                            {a.attachments && a.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-outline-variant/20">
                                    {a.attachments.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/40 bg-surface text-sm font-medium text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                                            <span className="material-symbols-outlined text-[16px]">attach_file</span>
                                            {file.name || `Tệp ${idx+1}`}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="md:w-48 flex md:flex-col justify-end md:justify-start items-center md:items-end gap-3 shrink-0 md:border-l md:border-outline-variant/20 md:pl-6">
                            <button 
                                type="button" 
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm ${isPinned ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300' : 'bg-surface text-on-surface-variant border-outline-variant/50 hover:bg-surface-container-low hover:text-on-surface'}`}
                                onClick={() => togglePin(a._id)}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isPinned ? 'filled' : ''}`} style={isPinned ? { fontVariationSettings: "'FILL' 1" } : {}}>push_pin</span>
                                {isPinned ? 'Bỏ ghim' : 'Ghim bài'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
}
