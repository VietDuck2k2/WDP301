import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

export default function StudentGrades() {
  const [data, setData] = useState({ grades: [], summary: null });
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getClasses().then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    const api = classId ? studentApi.getMyGradesByClass(classId) : studentApi.getMyGrades();
    api
      .then((res) => {
        if (res?.success && res.data) {
          setData({
            grades: res.data.grades || res.data || [],
            summary: res.data.summary || null,
          });
        } else setData({ grades: [], summary: null });
      })
      .catch(() => setData({ grades: [], summary: null }))
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Bảng điểm của tôi</h1>
          <p className="text-on-surface-variant font-medium font-body flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">military_tech</span>
             Theo dõi điểm số và kết quả học tập
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-outline ml-2">filter_list</span>
            <select 
                value={classId} 
                onChange={(e) => setClassId(e.target.value)} 
                className="bg-transparent border-none outline-none text-sm font-bold text-on-surface py-2 pr-8 cursor-pointer focus:ring-0"
            >
                <option value="">Tất cả khóa học</option>
                {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
        </div>
      </div>

      {data.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:border-primary transition-colors">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined">done_all</span>
                </div>
                <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Đã chấm</p>
                <p className="text-3xl font-black text-on-surface font-headline">{data.summary.graded || 0}</p>
            </div>
            
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:border-amber-500 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Chờ chấm</p>
                <p className="text-3xl font-black text-on-surface font-headline">{data.summary.pending || 0}</p>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col gap-2 relative overflow-hidden group hover:border-red-500 transition-colors">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined">error</span>
                </div>
                <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Chưa nộp</p>
                <p className="text-3xl font-black text-on-surface font-headline">{data.summary.notSubmitted || 0}</p>
            </div>

            <div className="bg-primary text-white p-6 rounded-2xl shadow-md flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center mb-2 relative z-10 border border-white/20">
                    <span className="material-symbols-outlined">grade</span>
                </div>
                <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest relative z-10">Điểm trung bình</p>
                <div className="flex items-baseline gap-1 relative z-10">
                    <p className="text-4xl font-black font-headline tracking-tighter">{data.summary.averagePercentage != null ? data.summary.averagePercentage : '--'}</p>
                    <span className="text-xl font-bold opacity-80">%</span>
                </div>
            </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface/50">
            <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">list_alt</span> Chi tiết điểm số
            </h3>
        </div>
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
                <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">Đang tải dữ liệu...</p>
            </div>
        ) : (!data.grades || data.grades.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl opacity-30">receipt_long</span>
                <p className="font-medium">Chưa có dữ liệu điểm cho lựa chọn này.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant">
                            <th className="p-5 font-bold border-b border-outline-variant/20 w-[30%]">Bài tập</th>
                            <th className="p-5 font-bold border-b border-outline-variant/20">Lớp học</th>
                            <th className="p-5 font-bold border-b border-outline-variant/20">Hạn nộp</th>
                            <th className="p-5 font-bold border-b border-outline-variant/20">Trạng thái</th>
                            <th className="p-5 font-bold border-b border-outline-variant/20 text-right">Điểm số</th>
                            <th className="p-5 font-bold border-b border-outline-variant/20 w-[20%]">Nhận xét</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {data.grades.map((g, i) => {
                            const isSubmitted = g.submission?.status === 'submitted';
                            const isGraded = g.submission?.status === 'graded';
                            const scoreText = g.submission?.score != null ? `${g.submission.score}` : '--';
                            
                            return (
                                <tr key={g.assignment?._id || i} className="border-b border-outline-variant/10 hover:bg-surface/50 transition-colors group">
                                    <td className="p-5">
                                        <p className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">{g.assignment?.title}</p>
                                    </td>
                                    <td className="p-5">
                                        <span className="bg-surface-container px-2 py-1 rounded text-xs font-semibold whitespace-nowrap border border-outline-variant/20">
                                            {g.assignment?.class?.name || '-'}
                                        </span>
                                    </td>
                                    <td className="p-5 font-medium text-on-surface-variant whitespace-nowrap">
                                        {formatDate(g.assignment?.dueDate)}
                                    </td>
                                    <td className="p-5 whitespace-nowrap">
                                        {isGraded ? (
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-200/50">Đã chấm</span>
                                        ) : isSubmitted ? (
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-blue-200/50">Đã nộp</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-wider border border-outline-variant/30">Chưa nộp</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right whitespace-nowrap">
                                        {isGraded ? (
                                            <div className="inline-flex items-baseline gap-1">
                                                <span className="text-lg font-black text-primary">{scoreText}</span>
                                                <span className="text-[10px] font-bold text-on-surface-variant">/ {g.assignment?.maxScore || 100}</span>
                                                <span className="ml-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">{g.submission?.percentage}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-outline font-medium">-</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-xs text-on-surface-variant italic line-clamp-2" title={g.submission?.feedback}>
                                        {g.submission?.feedback ? `"${g.submission.feedback}"` : <span className="opacity-50 text-not-italic">Không có nhận xét</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
