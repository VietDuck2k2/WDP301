import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

export default function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
        try {
            const res = await axiosInstance.get('/student/classes');
            if (res?.data?.success && res.data.data) {
                setClasses(res.data.data);
            }
        } catch (err) {
            setError('Không thể tải danh sách khóa học.');
        } finally {
            setLoading(false);
        }
    };
    fetchClasses();
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Khóa học của tôi</h1>
          <p className="text-on-surface-variant font-medium font-body flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">school</span>
             {classes.length} khóa học đang tham gia
          </p>
        </div>
      </div>

      {error && <div className="p-4 bg-error-container text-on-error-container rounded-lg font-medium text-sm mb-6 border border-error/20 flex gap-2"><span className="material-symbols-outlined">error</span> {error}</div>}

      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
            <p className="font-semibold tracking-widest uppercase text-xs">Đang tải dữ liệu...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center gap-4 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-outline text-3xl">school</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface font-headline">Chưa có khóa học nào</h3>
            <p className="text-on-surface-variant text-sm max-w-md">Hiện tại bạn chưa được xếp vào bất kỳ lớp học nào. Vui lòng liên hệ trung tâm để được hỗ trợ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {classes.map((cls, idx) => {
            const gradients = [
                'from-[#0037b0] to-[#1d4ed8]',
                'from-[#006a48] to-[#10b981]',
                'from-[#a73400] to-[#f97316]',
                'from-[#4d5b94] to-[#6366f1]',
                'from-[#005236] to-[#00714d]'
            ];
            const bgGradient = gradients[idx % gradients.length];

            return (
              <div key={cls._id} className="bg-surface-container-lowest rounded-xl overflow-hidden whisper-shadow border border-outline-variant/15 flex flex-col group hover:-translate-y-1 transition-transform duration-300">
                <div className={`h-40 bg-gradient-to-r ${bgGradient} relative flex items-center justify-center overflow-hidden`}>
                   <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                   <span className="text-white/90 font-extrabold text-6xl opacity-40 tracking-tighter uppercase">{cls.course?.courseCode || 'CLASS'}</span>
                   <div className="absolute top-4 left-4">
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/30">{cls.code}</span>
                   </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                    <h4 className="text-[1.5rem] font-bold text-on-surface mb-2 font-headline leading-tight group-hover:text-primary transition-colors">{cls.name}</h4>
                    <p className="text-sm text-on-surface-variant mb-6 font-medium font-body flex-1">{cls.course?.name || 'Chương trình học tiêu chuẩn'}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-surface p-3 rounded-lg border border-outline-variant/10">
                            <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-1">Thời gian học</p>
                            <p className="text-sm font-semibold text-on-surface truncate">{formatDate(cls.startDate)} - {formatDate(cls.endDate)}</p>
                        </div>
                        <div className="bg-surface p-3 rounded-lg border border-outline-variant/10">
                            <p className="text-[10px] uppercase font-bold text-outline tracking-wider mb-1">Quy mô</p>
                            <p className="text-sm font-semibold text-on-surface flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-primary">group</span> {cls.students?.length || 0} Học viên</p>
                        </div>
                    </div>

                    <NavLink 
                        to={`/student/classes/${cls._id}`} 
                        className="w-full py-3 text-center rounded-full bg-primary text-white font-bold tracking-tight shadow-md hover:bg-primary-container hover:shadow-lg transition-all flex justify-center items-center gap-2"
                    >
                        Vào Lớp Học <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </NavLink>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
