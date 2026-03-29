import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');

export default function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({});
  const [feedback, setFeedback] = useState({});
  const [savingState, setSavingState] = useState({}); // Tracking save state per submission

  useEffect(() => {
    if (!id) return;
    teacherApi.getAssignmentById(id).then((res) => {
      if (res?.success && res.data) setAssignment(res.data);
    }).finally(() => setLoading(false));
    
    teacherApi.getAssignmentSubmissions(id).then((res) => {
      if (res?.success && res.data) setSubmissions(Array.isArray(res.data) ? res.data : []);
    });
  }, [id]);

  const handleGrade = async (subId) => {
    const score = grading[subId]; 
    const fb = feedback[subId];
    if (score == null || score === '') return;
    
    setSavingState(prev => ({ ...prev, [subId]: 'saving' }));
    
    try {
        await teacherApi.gradeSubmission(subId, { score: Number(score), feedback: fb || '' });
        setSubmissions((prev) => prev.map((s) => (s._id === subId ? { ...s, score: Number(score), feedback: fb || '', status: 'graded' } : s)));
        setSavingState(prev => ({ ...prev, [subId]: 'success' }));
        setTimeout(() => setSavingState(prev => ({ ...prev, [subId]: null })), 2000);
    } catch (error) {
        setSavingState(prev => ({ ...prev, [subId]: 'error' }));
        setTimeout(() => setSavingState(prev => ({ ...prev, [subId]: null })), 3000);
        alert('Có lỗi xảy ra khi lưu điểm.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
        case 'graded':
            return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Đã chấm điểm</span>;
        case 'submitted':
        case 'submitted_late':
            return <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-200">Chờ chấm</span>;
        default:
            return <span className="bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30">Chưa nộp</span>;
    }
  };

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 max-w-[1600px] mx-auto fade-in">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Đang tải dữ liệu...</p>
        </div>
      );
  }

  if (!assignment) {
      return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 max-w-[1600px] mx-auto fade-in text-center">
            <span className="material-symbols-outlined text-6xl text-red-500/50 mb-2">error</span>
            <h2 className="text-2xl font-bold text-on-surface font-headline">Không tìm thấy bài tập</h2>
            <button className="text-primary font-bold hover:underline" onClick={() => navigate('/teacher/assignments')}>Quay lại danh sách</button>
        </div>
      );
  }

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="mb-6">
        <button 
            onClick={() => navigate('/teacher/assignments')} 
            className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại Danh sách Bài tập
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-8 items-start">
          
          {/* Main Content Area - Submissions Table */}
          <div className="order-2 xl:order-1">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface font-headline flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-3xl">task</span>
                      Chấm điểm bài nộp
                      <span className="bg-primary/10 text-primary text-sm font-body px-3 py-1 rounded-full border border-primary/20">
                          {submissions.length} học viên
                      </span>
                  </h2>
              </div>

              <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant font-bold border-b border-outline-variant/20">
                                <th className="p-5 w-64">Học sinh</th>
                                <th className="p-5 hidden md:table-cell">Nộp lúc</th>
                                <th className="p-5 text-center">Trạng thái</th>
                                <th className="p-5 w-40 text-center">Cho Điểm</th>
                                <th className="p-5 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {submissions.map((s) => (
                            <tr key={s._id} className="border-b border-outline-variant/10 hover:bg-surface/30 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-3 font-bold text-on-surface">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-1 ring-primary/20 shrink-0">
                                            {s.student?.firstName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p>{s.student?.firstName} {s.student?.lastName}</p>
                                            <p className="text-[11px] font-medium text-on-surface-variant mt-0.5">{s.student?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5 font-medium text-on-surface-variant hidden md:table-cell">
                                    {formatDate(s.submittedAt)}
                                </td>
                                <td className="p-5 text-center">
                                    {getStatusBadge(s.status)}
                                </td>
                                <td className="p-5 text-center">
                                    <div className="flex flex-col gap-2 relative">
                                        {s.score != null ? (
                                            <div className="font-headline font-black text-2xl text-primary flex justify-center items-baseline gap-1">
                                                {s.score} <span className="text-sm text-on-surface-variant font-body">/ {assignment.maxScore}</span>
                                            </div>
                                        ) : (
                                            <div className="relative flex justify-center">
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    max={assignment.maxScore} 
                                                    className="w-24 bg-surface border border-outline-variant/50 rounded-xl py-2 px-3 text-center text-lg font-bold focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/30 font-headline text-primary" 
                                                    placeholder="0"
                                                    value={grading[s._id] ?? ''} 
                                                    onChange={(e) => setGrading((g) => ({ ...g, [s._id]: e.target.value }))} 
                                                    disabled={savingState[s._id] === 'saving'}
                                                />
                                                <span className="absolute right-0 -mr-6 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant font-bold opacity-50 select-none">
                                                    /{assignment.maxScore}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Inline Feedback Input below score */}
                                        {s.score == null && (
                                            <input 
                                                type="text" 
                                                className="w-full mt-2 bg-surface text-xs border border-outline-variant/50 rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/50" 
                                                placeholder="Nhận xét ngắn..." 
                                                value={feedback[s._id] ?? ''} 
                                                onChange={(e) => setFeedback((f) => ({ ...f, [s._id]: e.target.value }))} 
                                                disabled={savingState[s._id] === 'saving'}
                                            />
                                        )}
                                    </div>
                                </td>
                                <td className="p-5 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        {/* Action Button: Grading or Edit/Download (Download TBD depending on files) */}
                                        {s.score == null && (grading[s._id] != null && grading[s._id] !== '') ? (
                                            <button 
                                                type="button" 
                                                className="w-28 inline-flex items-center justify-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-primary-container transition-all shadow-sm shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed" 
                                                onClick={() => handleGrade(s._id)}
                                                disabled={savingState[s._id] === 'saving'}
                                            >
                                                {savingState[s._id] === 'saving' ? (
                                                    <><span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Lưu...</>
                                                ) : (
                                                    <><span className="material-symbols-outlined text-[14px]">save</span> Lưu Điểm</>
                                                )}
                                            </button>
                                        ) : s.score != null ? (
                                             <div className="flex items-center gap-1 text-emerald-600 font-medium text-xs">
                                                 <span className="material-symbols-outlined text-[16px]">check_circle</span> Hoàn tất
                                             </div>
                                        ) : (
                                            <span className="text-xs text-on-surface-variant opacity-60 font-medium">Chưa có điểm</span>
                                        )}
                                        
                                        {savingState[s._id] === 'success' && <span className="text-[10px] text-emerald-600 font-bold block mt-1 animate-pulse">Lưu thành công!</span>}
                                        {savingState[s._id] === 'error' && <span className="text-[10px] text-red-600 font-bold block mt-1">Lỗi khi lưu</span>}
                                    </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                    {submissions.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
                            <span className="material-symbols-outlined text-4xl opacity-30">hourglass_empty</span>
                            <p className="font-medium text-sm">Chưa có học viên nào nộp bài.</p>
                        </div>
                    )}
                </div>
              </div>
          </div>
          
          {/* Sidebar - Assignment Details */}
          <div className="order-1 xl:order-2 space-y-6">
              <div className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 border border-outline-variant/30 shadow-[0_12px_40px_rgba(0,0,0,0.04)] relative overflow-hidden sticky top-8">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-md text-[10px] uppercase tracking-widest font-bold border border-outline-variant/30 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">school</span>
                            {assignment.class?.name || 'Không rõ lớp'}
                        </span>
                    </div>

                    <h1 className="text-2xl font-extrabold tracking-tight mb-4 text-on-surface font-headline leading-snug">{assignment.title}</h1>
                    
                    <div className="space-y-4 mb-6">
                         <div className="flex items-start gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                             <div className="w-8 h-8 rounded-lg bg-red-100/80 text-red-700 flex items-center justify-center shrink-0">
                                 <span className="material-symbols-outlined text-[18px]">event</span>
                             </div>
                             <div>
                                 <p className="text-[10px] uppercase tracking-wider font-bold text-red-800/60 mb-0.5">Thời hạn nộp bài</p>
                                 <p className="font-bold text-red-900 text-sm">{formatDate(assignment.dueDate)}</p>
                             </div>
                         </div>

                         <div className="flex items-start gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                             <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                                 <span className="material-symbols-outlined text-[18px]">verified</span>
                             </div>
                             <div>
                                 <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800/60 mb-0.5">Điểm tối đa</p>
                                 <p className="font-bold text-amber-900 text-sm">{assignment.maxScore} điểm</p>
                             </div>
                         </div>
                    </div>

                    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Mô tả bài tập</h4>
                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                            {assignment.description || <span className="opacity-50 italic">Không có mô tả chi tiết.</span>}
                        </p>
                        
                        {assignment.instructions && (
                            <div className="mt-4 pt-4 border-t border-outline-variant/20">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Hướng dẫn / Yêu cầu</h4>
                                <p className="text-sm font-medium text-on-surface">{assignment.instructions}</p>
                            </div>
                        )}
                    </div>

                    {assignment.attachments && assignment.attachments.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">attach_file</span>
                                Tệp đính kèm ({assignment.attachments.length})
                            </h4>
                            <div className="space-y-2">
                                {assignment.attachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/40 bg-surface hover:bg-surface-container-lowest transition-colors cursor-pointer group">
                                        <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[16px]">insert_drive_file</span>
                                        </div>
                                        <p className="text-sm font-medium text-on-surface truncate flex-1">{file.name || `Tệp đính kèm ${idx+1}`}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              </div>
          </div>

      </div>
    </div>
  );
}
