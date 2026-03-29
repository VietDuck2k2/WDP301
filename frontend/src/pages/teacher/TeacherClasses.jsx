import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

// Array of gradients for class cards
const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-fuchsia-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600'
];

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    teacherApi.getMyClasses()
      .then(res => {
        if (res?.success && res.data) {
          setClasses(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Lớp học giảng dạy</h1>
          <p className="text-on-surface-variant font-medium font-body flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">co_present</span>
             Danh sách các lớp bạn đang được phân công phụ trách
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
            <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">Đang tải danh sách lớp...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl opacity-50">school</span>
            </div>
            <p className="font-bold text-lg text-on-surface">Chưa có lớp học</p>
            <p className="text-sm">Bạn chưa được phân công phụ trách lớp học nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 hover-group">
          {classes.map((cls, index) => {
            const gradient = GRADIENTS[index % GRADIENTS.length];
            const isActive = cls.status === 'active';
            
            return (
              <div 
                key={cls._id} 
                onClick={() => navigate(`/teacher/classes/${cls._id}`)}
                className="group relative flex flex-col bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/30 cursor-pointer will-change-transform shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Card Header with Gradient */}
                <div className={`h-32 bg-gradient-to-br ${gradient} p-6 relative flex flex-col justify-between overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="flex justify-between items-start relative z-10 w-full">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[11px] font-bold uppercase tracking-widest border border-white/20 shadow-sm">
                      {cls.code}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm backdrop-blur-md ${isActive ? 'bg-emerald-500/20 text-white border-emerald-300/30' : 'bg-slate-800/40 text-slate-200 border-slate-600/50'}`}>
                      {isActive ? 'Đang học' : 'Đã đóng'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex flex-col flex-grow relative bg-surface-container-lowest">
                  <div className="absolute -top-6 left-6 w-12 h-12 bg-surface-container-lowest rounded-2xl flex items-center justify-center shadow-sm border border-outline-variant/20 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                    <span className="material-symbols-outlined text-primary text-xl">class</span>
                  </div>
                  
                  <div className="mt-8 mb-4">
                    <h2 className="text-xl font-black font-headline text-on-surface leading-tight group-hover:text-primary transition-colors line-clamp-2" title={cls.name}>
                      {cls.name}
                    </h2>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-outline-variant/20 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[16px]">groups</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-outline font-bold">Học viên</p>
                            <p className="text-sm font-bold text-on-surface">{cls.capacity || '--'}</p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
