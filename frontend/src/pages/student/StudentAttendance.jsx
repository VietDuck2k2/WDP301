import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');
const STATUS_LABEL = { 
  present: 'Có mặt', 
  absent: 'Vắng mặt'
};

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    studentApi.getClasses().then((res) => { 
      if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); 
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchSummary = classId 
      ? studentApi.getMyAttendanceByClass(classId) 
      : studentApi.getMyAttendanceSummary();
    
    const historyParams = classId ? { classId } : {};
    const fetchHistory = studentApi.getMyAttendances(historyParams);

    Promise.all([fetchSummary, fetchHistory])
      .then(([summaryRes, historyRes]) => {
        if (summaryRes?.success) setSummary(summaryRes.data);
        else setSummary(null);

        if (historyRes?.success && historyRes.data) {
          setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        } else {
          setHistory([]);
        }
      })
      .catch(err => {
        setSummary(null);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Chuyên cần</h1>
          <p className="text-on-surface-variant font-medium font-body flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">fact_check</span>
             Theo dõi tỷ lệ tham gia lớp học
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/20 shadow-inner">
              <button 
                className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${tab === 'summary' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setTab('summary')}
              >
                Tổng quan
              </button>
              <button 
                className={`py-2 px-6 rounded-lg font-bold text-sm transition-all ${tab === 'history' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                onClick={() => setTab('history')}
              >
                Lịch sử
              </button>
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
      </div>

      <div className="mt-8">
         {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
                <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">Đang tải dữ liệu...</p>
            </div>
         ) : tab === 'summary' ? (
            summary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="w-12 h-12 rounded-full bg-surface-container text-on-surface flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <p className="text-xs font-bold text-outline uppercase tracking-widest">Tổng số buổi</p>
                        <p className="text-5xl font-black text-on-surface font-headline">{summary.total || 0}</p>
                    </div>
                    
                    <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-4 -mt-4"></div>
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-100/50 relative z-10">
                            <span className="material-symbols-outlined">how_to_reg</span>
                        </div>
                        <p className="text-xs font-bold text-outline uppercase tracking-widest relative z-10">Có mặt</p>
                        <p className="text-5xl font-black text-emerald-600 font-headline relative z-10">{summary.present || 0}</p>
                    </div>

                    <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-4 -mt-4"></div>
                        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2 border border-red-100/50 relative z-10">
                            <span className="material-symbols-outlined">person_off</span>
                        </div>
                        <p className="text-xs font-bold text-outline uppercase tracking-widest relative z-10">Vắng mặt</p>
                        <p className="text-5xl font-black text-red-600 font-headline relative z-10">{summary.absent || 0}</p>
                    </div>

                    <div className="bg-primary text-white p-8 rounded-3xl shadow-lg flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center mb-2 relative z-10 border border-white/20">
                            <span className="material-symbols-outlined">pie_chart</span>
                        </div>
                        <p className="text-xs font-bold text-white/80 uppercase tracking-widest relative z-10">Tỷ lệ chuyên cần</p>
                        <div className="flex items-baseline gap-1 relative z-10">
                            <p className="text-6xl font-black font-headline tracking-tighter">{summary.attendanceRate ?? '-'}</p>
                            <span className="text-2xl font-bold opacity-80">%</span>
                        </div>
                    </div>
                </div>
            ) : (
               <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-on-surface-variant">
                   <span className="material-symbols-outlined text-6xl opacity-30">analytics</span>
                   <p className="font-medium">Chưa có dữ liệu tổng hợp cho lớp này.</p>
               </div>
            )
         ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface/50">
                    <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">history</span> Lịch sử điểm danh
                    </h3>
                </div>
               
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
                        <span className="material-symbols-outlined text-6xl opacity-30">hourglass_empty</span>
                        <p className="font-medium">Bạn chưa tham gia buổi học nào được điểm danh.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant">
                                    <th className="p-5 font-bold border-b border-outline-variant/20">Ngày học</th>
                                    <th className="p-5 font-bold border-b border-outline-variant/20 w-[40%]">Tên buổi học</th>
                                    <th className="p-5 font-bold border-b border-outline-variant/20 text-center">Trạng thái</th>
                                    <th className="p-5 font-bold border-b border-outline-variant/20">Ghi chú từ giáo viên</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {history.map((a) => (
                                    <tr key={a._id} className="border-b border-outline-variant/10 hover:bg-surface/50 transition-colors">
                                        <td className="p-5 font-medium whitespace-nowrap text-on-surface-variant">
                                            {formatDate(a.session?.date)}
                                        </td>
                                        <td className="p-5 font-bold text-on-surface line-clamp-1">
                                            {a.session?.title || 'Buổi học không xác định'}
                                        </td>
                                        <td className="p-5 text-center">
                                            {a.status === 'present' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    Có mặt
                                                </span>
                                            ) : a.status === 'absent' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                    Vắng mặt
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 bg-surface text-on-surface-variant border border-outline-variant/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    {STATUS_LABEL[a.status] || a.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-xs text-on-surface-variant italic">
                                            {a.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
         )}
      </div>
    </div>
  );
}
