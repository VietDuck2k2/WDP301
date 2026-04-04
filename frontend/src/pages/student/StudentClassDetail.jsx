import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import axiosInstance from '../../api/axios';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

export default function StudentClassDetail() {
  const { classId } = useParams();
  const [activeTab, setActiveTab] = useState('announcements');
  
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [classRes, studentsRes, annRes, assignRes] = await Promise.all([
          axiosInstance.get(`/student/classes/${classId}`).catch(() => null),
          axiosInstance.get(`/student/classes/${classId}/students`).catch(() => null),
          axiosInstance.get(`/student/classes/${classId}/announcements`).catch(() => null),
          axiosInstance.get(`/student/classes/${classId}/assignments`).catch(() => null)
        ]);

        if (classRes?.data) setClassInfo(classRes.data);
        if (studentsRes?.data) setStudents(studentsRes.data);
        if (annRes?.data) setAnnouncements(annRes.data);
        if (assignRes?.data) setAssignments(assignRes.data);

      } catch (err) {
        setError('Không thể tải dữ liệu lớp học.');
      } finally {
        setLoading(false);
      }
    };
    
    if (classId) fetchData();
  }, [classId]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <span className="material-symbols-outlined animate-spin text-primary text-5xl">sync</span>
            <p className="text-on-surface-variant font-bold uppercase tracking-widest text-sm">Đang tải không gian lớp học...</p>
        </div>
    );
  }

  if (error || !classInfo) {
    return (
        <div className="max-w-[1200px] mx-auto fade-in">
           <div className="p-8 bg-error-container text-on-error-container rounded-xl flex items-center justify-center gap-2 font-bold">
               <span className="material-symbols-outlined">error</span> {error || "Không tìm thấy lớp học"}
           </div>
        </div>
    );
  }

  const TABS = [
      { id: 'announcements', label: 'Bảng tin', icon: 'campaign' },
      { id: 'assignments', label: 'Bài tập', icon: 'assignment' },
      { id: 'students', label: 'Thành viên', icon: 'group' }
  ];

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      {/* Header Back Button */}
      <div className="mb-6">
        <NavLink to="/student/classes" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại danh sách khóa học
        </NavLink>
      </div>

      {/* Hero Header */}
      <div className="bg-primary text-white rounded-3xl p-10 md:p-14 relative overflow-hidden mb-8 shadow-md">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
          <div className="w-full h-full bg-white blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 mix-blend-overlay"></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-white/20 pb-8 mb-6">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/30">
                        {classInfo.code}
                    </span>
                    <span className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">
                        Phòng: {classInfo.room || 'N/A'}
                    </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline mb-2">{classInfo.name}</h1>
                <p className="text-primary-fixed-dim text-lg">{classInfo.course?.name || 'Khóa học'}</p>
            </div>
            
            <div className="bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/10 min-w-[200px]">
                <p className="text-[10px] text-primary-fixed uppercase tracking-widest font-bold mb-1">
                    <span className="material-symbols-outlined text-[14px] align-middle">person</span> {classInfo.teachers?.length > 1 ? 'Giáo viên hướng dẫn' : 'Giáo viên'}
                </p>
                <div className="flex flex-col gap-1">
                    {classInfo.teachers?.length > 0 ? (
                        classInfo.teachers.map((t, idx) => (
                            <p key={t._id || idx} className="font-bold text-lg leading-tight">
                                {t.firstName} {t.lastName}
                            </p>
                        ))
                    ) : (
                        <p className="font-bold text-lg">Chưa phân công</p>
                    )}
                </div>
            </div>
        </div>
        
        {/* Sticky Tab Bar inside Header */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
            {TABS.map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                            ? 'bg-surface text-primary shadow-sm' 
                            : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                >
                    <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                    {tab.label}
                    {tab.id === 'announcements' && announcements.length > 0 && <span className="ml-1 bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full">{announcements.length}</span>}
                    {tab.id === 'assignments' && assignments.length > 0 && <span className="ml-1 bg-secondary text-white text-[10px] px-1.5 py-0.5 rounded-full">{assignments.length}</span>}
                    {tab.id === 'students' && students.length > 0 && <span className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">{students.length}</span>}
                </button>
            ))}
        </div>
      </div>

      {/* Tab Content Section */}
      <div className="bg-surface-container-lowest rounded-b-3xl rounded-tr-3xl min-h-[500px] p-6 md:p-10 shadow-sm border border-outline-variant/20 -mt-12 pt-14">
            
        {/* TAB 1: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
            <div className="flex flex-col gap-6 fade-in">
                <h3 className="text-xl font-bold text-on-surface font-headline mb-4">Thông báo từ giáo viên</h3>
                {announcements.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4 text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl opacity-40">notifications_off</span>
                        <p>Chưa có thông báo nào từ giáo viên cho lớp học này.</p>
                    </div>
                ) : (
                    announcements.map(ann => (
                        <div key={ann._id} className="p-6 bg-surface rounded-xl border border-outline-variant/30 flex gap-5 hover:bg-surface-container-low transition-colors group">
                            <div className="w-12 h-12 bg-primary-container text-white rounded-full flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">campaign</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-bold text-[1.15rem] text-on-surface group-hover:text-primary transition-colors">{ann.title}</h4>
                                    {new Date(ann.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) && (
                                        <span className="bg-error text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Mới</span>
                                    )}
                                </div>
                                <p className="text-xs text-outline font-medium mb-3">{formatDate(ann.createdAt)}</p>
                                <div className="text-sm text-on-surface-variant whitespace-pre-wrap">{ann.content}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* TAB 2: ASSIGNMENTS */}
        {activeTab === 'assignments' && (
            <div className="flex flex-col gap-6 fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-on-surface font-headline">Bài tập & Đồ án</h3>
                </div>
                
                {assignments.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4 text-on-surface-variant bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/50">
                        <span className="material-symbols-outlined text-5xl opacity-40">fact_check</span>
                        <p>Bạn chưa có bài tập nào cho lớp học này. Hãy tận hưởng thời gian nghỉ ngơi nhé!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {assignments.map(assignment => {
                            const isOverdue = new Date() > new Date(assignment.dueDate);
                            return (
                                <NavLink 
                                    to={`/student/assignments/${assignment._id}/submit`} 
                                    key={assignment._id}
                                    className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md hover:border-primary transition-all group"
                                >
                                    <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="material-symbols-outlined text-[32px]">assignment</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-on-surface mb-2 group-hover:text-primary transition-colors">{assignment.title}</h4>
                                        <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{assignment.description}</p>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className={`text-[11px] px-3 py-1 rounded-lg font-bold border flex items-center gap-1 ${isOverdue ? 'bg-error-container/30 text-error border-error/20' : 'bg-amber-50 text-amber-800 border-amber-200/50'}`}>
                                                <span className="material-symbols-outlined text-[14px]">schedule</span> 
                                                Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            
                                            {assignment.attachments?.length > 0 && (
                                                <span className="text-[11px] px-3 py-1 bg-surface border border-outline-variant/30 text-slate-600 rounded-lg flex items-center gap-1 font-bold shadow-sm">
                                                    <span className="material-symbols-outlined text-[14px] text-blue-600">attachment</span> 
                                                    <span className="text-blue-800">{assignment.attachments.length} tệp đính kèm</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </NavLink>
                            );
                        })}
                    </div>
                )}
            </div>
        )}

        {/* TAB 3: STUDENTS */}
        {activeTab === 'students' && (
            <div className="flex flex-col gap-6 fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-on-surface font-headline">Bạn cùng lớp</h3>
                    <span className="bg-surface px-4 py-1.5 rounded-lg border border-outline-variant/30 text-sm font-bold text-on-surface-variant">
                        Tổng số: {students.length}
                    </span>
                </div>
                
                {students.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4 text-on-surface-variant">
                        <span className="material-symbols-outlined text-5xl opacity-40">group_off</span>
                        <p>Danh sách học viên trống.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map((student, idx) => (
                            <div key={student._id} className="flex items-center gap-4 p-4 bg-surface border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors">
                                <div className="w-12 h-12 bg-primary/10 text-primary font-bold text-lg rounded-full flex items-center justify-center uppercase shrink-0 border border-primary/20">
                                    {student.lastName?.charAt(0) || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-on-surface text-sm truncate">{student.lastName} {student.firstName}</p>
                                    <p className="text-[11px] text-outline font-medium truncate">{student.email}</p>
                                    <p className="text-[10px] text-on-surface-variant font-bold mt-0.5 bg-outline-variant/20 inline-block px-1.5 py-0.5 rounded tracking-widest">{student.code}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
}
