import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import FileUpload from '../../components/FileUpload';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

export default function AssignmentSubmit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    studentApi.getAssignmentById(id).then((res) => { if (res?.success && res.data) setAssignment(res.data); });
    studentApi.getMySubmissionForAssignment(id).then((res) => {
      if (res?.success && res.data) { 
          setMySubmission(res.data); 
          setContent(res.data.content || ''); 
          setAttachments(res.data.attachments || []); 
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    studentApi.submitAssignment(id, { content, attachments })
      .then((res) => { if (res?.success) { setMySubmission(res.data); setSuccess(true); } else setError(res?.message || 'Nộp bài thất bại'); })
      .catch((err) => setError(err.response?.data?.message || 'Nộp bài thất bại'))
      .finally(() => setSubmitting(false));
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setError('');
    setSuccess(false);
    studentApi.saveDraft(id, { content }).then((res) => { 
        if (res?.success) {
            setMySubmission(res.data); 
            setSuccess(true);
        } 
    }).catch(() => {}).finally(() => setSubmitting(false));
  };

  if (loading || !assignment) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
            <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">Đang tải bài tập...</p>
        </div>
    );
  }

  const isOverdue = new Date() > new Date(assignment.dueDate);

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      {/* Header Back Button */}
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Assignment Details */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                        Bài tập
                    </span>
                    <span className="text-sm font-bold text-on-surface-variant">{assignment.class?.name || 'Lớp học'}</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-headline mb-4 text-on-surface">{assignment.title}</h1>
                
                <div className="flex flex-wrap gap-4 mb-8">
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border ${isOverdue ? 'bg-error-container/30 text-error border-error/20' : 'bg-amber-50 text-amber-800 border-amber-200/50'}`}>
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        Hạn nộp: {formatDate(assignment.dueDate)}
                        {isOverdue && <span className="ml-1 text-[10px] uppercase bg-error text-white px-2 py-0.5 rounded-full">Quá hạn</span>}
                    </div>
                    {assignment.maxScore && (
                        <div className="bg-surface px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm border border-outline-variant/30 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">military_tech</span>
                            Điểm tối đa: {assignment.maxScore}
                        </div>
                    )}
                </div>

                <div className="prose prose-sm md:prose-base max-w-none text-on-surface-variant mb-8 whitespace-pre-wrap">
                    {assignment.description}
                </div>

                {assignment.instructions && (
                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100/50 mt-6">
                        <h4 className="flex items-center gap-2 font-bold text-primary mb-2">
                            <span className="material-symbols-outlined">lightbulb</span> Hướng dẫn làm bài
                        </h4>
                        <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{assignment.instructions}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Submission Area */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            {mySubmission?.status === 'graded' ? (
                <div className="bg-emerald-50 rounded-2xl p-8 border border-emerald-200 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-emerald-500/10">
                        <span className="material-symbols-outlined text-[150px]">verified</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined">done_all</span>
                            </span>
                            <h3 className="text-xl font-extrabold text-emerald-900">Bài đã được chấm</h3>
                        </div>
                        
                        <div className="bg-white/60 p-6 rounded-xl mb-6 backdrop-blur-sm border border-emerald-200/50">
                            <p className="text-sm text-emerald-800 font-bold uppercase tracking-wider mb-1">Điểm số đạt được</p>
                            <div className="flex items-baseline gap-1 break-words">
                                <span className="text-5xl font-black text-emerald-600">{mySubmission.score}</span>
                                <span className="text-xl font-bold text-emerald-800/50">/{assignment.maxScore}</span>
                            </div>
                        </div>

                        {mySubmission.feedback && (
                            <div>
                                <p className="text-sm text-emerald-800 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">forum</span> Nhận xét từ giáo viên
                                </p>
                                <div className="bg-white/60 p-4 rounded-xl text-sm italic text-emerald-900 border border-emerald-200/50">
                                    "{mySubmission.feedback}"
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/30 shadow-[0_12px_40px_rgba(0,0,0,0.04)] sticky top-24">
                    <h3 className="text-xl font-extrabold text-on-surface mb-2">Bài làm của bạn</h3>
                    <p className="text-sm text-on-surface-variant font-medium mb-6 flex items-center gap-2">
                        Trạng thái: 
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${mySubmission?.status === 'submitted' ? 'bg-primary/10 text-primary' : 'bg-surface border border-outline-variant/30'}`}>
                            {mySubmission?.status === 'submitted' ? 'Đã nộp' : 'Bản nháp'}
                        </span>
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-on-surface mb-2">Nội dung trả lời</label>
                            <textarea 
                                placeholder="Nhập nội dung bài làm của bạn vào đây..." 
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                className="w-full bg-surface border border-outline-variant/30 rounded-xl p-4 text-sm min-h-[160px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
                                disabled={submitting}
                            />
                        </div>
                        
                        <div className="border border-dashed border-outline-variant/50 rounded-xl p-4 bg-surface hover:bg-surface-container-lowest transition-colors">
                            <FileUpload value={attachments} onChange={setAttachments} label="Tệp đính kèm (Word, Excel, PPT, PDF, Ảnh, Audio, TXT)" disabled={submitting} />
                        </div>

                        {error && (
                            <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm font-bold flex gap-2 items-center">
                                <span className="material-symbols-outlined text-[16px]">error</span> {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold flex gap-2 items-center border border-emerald-200">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span> Đã cập nhật bài nộp thành công!
                            </div>
                        )}

                        <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-outline-variant/20">
                            <button 
                                type="submit" 
                                className="w-full py-3.5 bg-primary hover:bg-primary-container text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                                disabled={submitting}
                            >
                                {submitting ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined group-hover:-translate-y-1 transition-transform">send</span>}
                                {submitting ? 'Đang xử lý...' : 'Nộp bài chính thức'}
                            </button>
                            {(!mySubmission || mySubmission.status !== 'submitted') && (
                                <button 
                                    type="button" 
                                    onClick={handleSaveDraft}
                                    className="w-full py-3 bg-surface-container text-on-surface hover:bg-surface-variant rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    disabled={submitting}
                                >
                                    <span className="material-symbols-outlined text-[18px]">save</span> Lưu nháp
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
