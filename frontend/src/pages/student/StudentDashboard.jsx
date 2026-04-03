import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    classes: [],
    attendanceSummary: null,
    grades: [],
    upcomingAssignments: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Classes and Attendance Summary
        const [classesRes, attendanceRes, gradesRes] = await Promise.all([
          axiosInstance.get('/student/classes').catch(() => null),
          axiosInstance.get('/student/attendances/summary').catch(() => null),
          axiosInstance.get('/student/grades').catch(() => null)
        ]);

        const classes = classesRes?.data || [];
        const attendanceSummary = attendanceRes?.data || null;
        const gradesData = gradesRes?.data || [];

        // Flatten grades from all classes
        let allGrades = [];
        if (Array.isArray(gradesData)) {
            gradesData.forEach(gClass => {
              if (gClass.grades) {
                const mappedGrades = gClass.grades.map(g => ({
                    ...g,
                    className: gClass.class.name
                }));
                allGrades = [...allGrades, ...mappedGrades];
              }
            })
        }

        // 2. Fetch Assignments for all enrolled classes
        let loadedAssignments = [];
        if (classes.length > 0) {
            const assignmentPromises = classes.map(cls => 
                axiosInstance.get(`/student/classes/${cls._id}/assignments`).catch(() => null)
            );
            const assignmentResults = await Promise.all(assignmentPromises);
            
            assignmentResults.forEach((res, index) => {
                if (res?.data) {
                    const currentClass = classes[index];
                    const classAssignments = res.data.map(a => ({ ...a, className: currentClass.name }));
                    loadedAssignments = [...loadedAssignments, ...classAssignments];
                }
            });
        }

        // Sort upcoming assignments by dueDate
        const upcomingAssignments = loadedAssignments
            .filter(a => new Date(a.dueDate) >= new Date())
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 4); // top 4

        // Sort recent grades
        const recentGrades = allGrades
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 4);

        setData({
          classes,
          attendanceSummary,
          grades: recentGrades,
          upcomingAssignments
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const progressPercent = data.attendanceSummary 
    ? Math.round((data.attendanceSummary.presentSessionCount / data.attendanceSummary.totalSessionCount) * 100) || 0
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-12 gap-8 fade-in">
      {/* Welcome Hero Section */}
      <section className="col-span-12 relative overflow-hidden rounded-xl p-10 glass-panel shadow-sm border border-outline-variant/30 mb-2">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-primary-container blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-2xl">
            <h1 className="text-[3rem] font-bold leading-tight tracking-tight text-on-surface mb-4">
              Chào mừng trở lại, {user?.firstName}! <br />
              <span className="text-primary font-headline">Bạn đang làm rất tốt.</span>
            </h1>
            <p className="text-on-surface-variant text-lg mb-8 max-w-lg">
              Giữ vững tiến độ học tập và tham gia đầy đủ các buổi học nhé. Chúc bạn một ngày học tập hiệu quả.
            </p>
          </div>
          
          <div className="w-full md:w-80 flex flex-col gap-3">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Tiến độ điểm danh</span>
              <span className="text-3xl font-extrabold text-emerald-500 font-headline">{loading ? '...' : `${progressPercent}%`}</span>
            </div>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Course Grid */}
      <section className="col-span-12 lg:col-span-8 order-1 lg:order-1">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface font-headline">Khóa học hiện tại</h2>
          <NavLink to="/student/classes" className="text-sm font-bold text-primary hover:opacity-80 transition-opacity">Xem tất cả</NavLink>
        </div>
        
        {loading ? (
            <div className="p-8 text-center text-slate-500 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">Đang tải dữ liệu khóa học...</div>
        ) : data.classes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30">Bạn chưa được xếp vào lớp học nào.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.classes.map((cls, idx) => {
                // Generate a random gradient class for visual variety based on index
                const gradients = [
                    'from-[#0037b0] to-[#1d4ed8]',
                    'from-[#006a48] to-[#10b981]',
                    'from-[#a73400] to-[#f97316]',
                    'from-[#4d5b94] to-[#6366f1]'
                ];
                const bgGradient = gradients[idx % gradients.length];

                return (
                <div key={cls._id} className="bg-surface-container-lowest rounded-xl overflow-hidden whisper-shadow border border-outline-variant/15 flex flex-col group">
                    <div className={`h-32 bg-gradient-to-r ${bgGradient} relative flex items-center justify-center`}>
                       <span className="text-white/80 font-extrabold text-5xl opacity-50 tracking-tighter uppercase">{cls.course?.courseCode || 'CLASS'}</span>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                        <h4 className="text-[1.35rem] font-bold text-on-surface mb-1 font-headline leading-tight group-hover:text-primary transition-colors">{cls.name}</h4>
                        <p className="text-sm text-on-surface-variant mb-6 font-medium font-body flex-1">{cls.course?.name || 'Chương trình học'}</p>
                        
                        <div className="flex justify-between items-center mb-6 text-sm text-slate-500">
                            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">group</span> {cls.students?.length || 0} HV</div>
                            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">schedule</span> {cls.sessions?.length || 0} Buổi</div>
                        </div>

                        <NavLink 
                            to={`/student/classes/${cls._id}`} 
                            className="w-full py-2.5 text-center rounded-lg bg-surface-container-low text-on-surface font-semibold tracking-tight shadow-sm border border-outline-variant/20 hover:bg-primary hover:text-white transition-all"
                        >
                            Vào Lớp Học
                        </NavLink>
                    </div>
                </div>
                )
            })}
            </div>
        )}
      </section>

      {/* Sidebar (Assignments & Grades) */}
      <aside className="col-span-12 lg:col-span-4 flex flex-col gap-8 order-2 lg:order-2">
        {/* Upcoming Assignments */}
        <div className="bg-surface-container-lowest rounded-xl p-8 whisper-shadow border border-outline-variant/15">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant font-label">Sắp đến hạn</h3>
             <NavLink to="/student/assignments" className="text-primary text-xs font-bold hover:underline">Xem thêm</NavLink>
          </div>
          
          <div className="flex flex-col gap-6">
            {loading ? (
                <p className="text-slate-500 text-sm">Đang tải...</p>
            ) : data.upcomingAssignments.length === 0 ? (
                <p className="text-slate-500 text-sm">Không có bài tập nào sắp đến hạn.</p>
            ) : (
                data.upcomingAssignments.map((assignment) => (
                    <div key={assignment._id} className="flex gap-4 p-2 -mx-2 hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-error-container/30 border border-error-container flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-error" style={{ fontSize: '20px' }}>assignment_late</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-bold text-on-surface text-sm truncate">{assignment.title}</p>
                        <p className="text-xs text-error font-semibold mt-0.5">Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-1">{assignment.className}</p>
                    </div>
                    </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="bg-surface-container-lowest rounded-xl p-8 whisper-shadow border border-outline-variant/15">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant font-label">Điểm số gần đây</h3>
             <NavLink to="/student/grades" className="text-primary text-xs font-bold hover:underline">Xem bảng điểm</NavLink>
          </div>

          <div className="flex flex-col gap-5">
            {loading ? (
                <p className="text-slate-500 text-sm">Đang tải...</p>
            ) : data.grades.length === 0 ? (
                <p className="text-slate-500 text-sm">Chưa có dữ liệu điểm.</p>
            ) : (
                data.grades.map((grade, idx) => (
                    <div key={idx} className="flex justify-between items-center group py-2 border-b border-outline-variant/10 last:border-0">
                    <div className="min-w-0 pr-4">
                        <p className="font-bold text-on-surface text-sm truncate">{grade.title}</p>
                        <p className="text-[11px] font-semibold text-primary mt-1 truncate bg-primary-fixed/50 inline-block px-2 py-0.5 rounded">{grade.className}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <span className="text-xl font-extrabold text-on-surface font-headline">{grade.achievedScore}</span>
                        <span className="text-xs text-on-surface-variant font-medium">/{grade.maxScore}</span>
                    </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StudentDashboard;
