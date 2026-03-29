import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

// First Level: List of classes taught by the teacher
function TeacherAttendanceClassList({ navigate }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getMyClasses()
      .then((res) => {
        if (res?.success && res.data) setClasses(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Điểm danh</h1>
          <p className="text-on-surface-variant font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            Chọn lớp học để bắt đầu điểm danh
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Đang tải...</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="p-5 border-b border-outline-variant/20">Mã Lớp</th>
                  <th className="p-5 border-b border-outline-variant/20">Tên Lớp</th>
                  <th className="p-5 border-b border-outline-variant/20">Trạng thái</th>
                  <th className="p-5 border-b border-outline-variant/20 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {classes.map((c) => (
                  <tr key={c._id} className="border-b border-outline-variant/10 hover:bg-surface/50 transition-colors">
                    <td className="p-5 font-bold text-primary">
                      <span className="bg-primary/5 border border-primary/20 px-2 py-1 rounded-md">{c.code}</span>
                    </td>
                    <td className="p-5 font-headline font-bold text-on-surface text-base">{c.name}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-surface-container text-on-surface-variant border-outline-variant/30'}`}>
                        {c.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-container transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:-translate-y-0.5" 
                        onClick={() => navigate(`/teacher/attendances/class/${c._id}`)}
                      >
                        Tiến hành <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {classes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-40">school</span>
                    <p className="font-bold">Bạn chưa được phân công giảng dạy lớp nào.</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Second Level: List of sessions for a selected class
function TeacherClassSessions({ classId, navigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.getSessionsByClassId(classId)
      .then((res) => {
        if (res?.success && res.data) setSessions(res.data);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getAttendanceStatus = (sessionDate, sessionTime) => {
    if (!sessionDate || !sessionTime) return { canEdit: false, label: 'N/A', badge: 'bg-surface-container text-on-surface-variant border-outline-variant/30' };
    
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const dStr = sessionDate instanceof Date ? sessionDate.toISOString().split('T')[0] : String(sessionDate).split('T')[0];
    const parts = dStr.split('-');
    const sessionStart = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), hours, minutes, 0, 0)
      : new Date(sessionDate);

    if (parts.length !== 3) {
      sessionStart.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const diffMs = now.getTime() - sessionStart.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { canEdit: false, label: 'Chưa mở', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    if (diffHours > 24) {
      return { canEdit: false, label: 'Đã khóa', badge: 'bg-surface-container text-on-surface-variant border-outline-variant/30' };
    }
    return { canEdit: true, label: 'Sẵn sàng', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="mb-6 flex justify-between items-center">
        <button onClick={() => navigate('/teacher/attendances')} className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Danh sách Lớp
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 lg:p-10 border border-outline-variant/30 shadow-[0_12px_40px_rgba(0,0,0,0.04)] relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-on-surface font-headline">Danh sách buổi học</h1>
          <p className="text-on-surface-variant font-medium font-body flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Chỉ được phép điểm danh trong vòng 24h kể từ khi bắt đầu.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Đang tải...</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="p-5 border-b border-outline-variant/20">Tiêu đề - Nội dung</th>
                  <th className="p-5 border-b border-outline-variant/20">Ngày học</th>
                  <th className="p-5 border-b border-outline-variant/20">Thời gian</th>
                  <th className="p-5 border-b border-outline-variant/20">Cổng điểm danh</th>
                  <th className="p-5 border-b border-outline-variant/20 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sessions.map((s) => {
                  const status = getAttendanceStatus(s.date, s.startTime);
                  return (
                    <tr key={s._id} className="border-b border-outline-variant/10 hover:bg-surface/50 transition-colors">
                      <td className="p-5">
                          <p className="font-headline font-bold text-on-surface text-base">{s.title}</p>
                          {s.description && <p className="text-xs text-on-surface-variant mt-1 line-clamp-1 max-w-sm">{s.description}</p>}
                      </td>
                      <td className="p-5 font-bold text-on-surface">
                          <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-primary/70">event</span>
                              {formatDate(s.date)}
                          </div>
                      </td>
                      <td className="p-5 font-medium text-on-surface-variant">
                          <div className="flex items-center gap-2 bg-surface-container w-fit px-2 py-1 rounded">
                              <span className="material-symbols-outlined text-[16px]">schedule</span>
                              {s.startTime} - {s.endTime}
                          </div>
                      </td>
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${status.badge}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-5 text-right flex items-center justify-end gap-2">
                        {status.canEdit ? (
                            <button 
                                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-primary-container transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:-translate-y-0.5" 
                                onClick={() => navigate(`/teacher/attendances/session/${s._id}`)}
                            >
                                <span className="material-symbols-outlined text-[16px]">how_to_reg</span> Điểm danh
                            </button>
                        ) : (
                            <button 
                                className="inline-flex items-center justify-center gap-2 bg-surface-container text-on-surface-variant px-4 py-2 rounded-lg font-bold text-sm hover:bg-surface-container-high hover:text-on-surface transition-all border border-outline-variant/30" 
                                onClick={() => navigate(`/teacher/attendances/session/${s._id}`)}
                            >
                                <span className="material-symbols-outlined text-[16px]">visibility</span> Xem báo cáo
                            </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl opacity-40">calendar_month</span>
                    <p className="font-bold">Lớp học chưa có lịch trình / buổi học nào.</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Third Level: Marking attendance
const STATUS_OPTIONS = [
  { value: 'present', label: 'Có mặt', icon: 'check_circle' },
  { value: 'absent', label: 'Vắng', icon: 'cancel' },
];

export default function TeacherAttendance() {
  const { classId, sessionId } = useParams();
  const navigate = useNavigate();
  
  const [list, setList] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [sessionDetail, setSessionDetail] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // sessionId processing hook must be called unconditionally before early returns
  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);

    Promise.all([
      teacherApi.getSessionById(sessionId).catch(() => null),
      teacherApi.getSessionAttendance(sessionId).catch(() => null)
    ])
      .then(([sessionRes, attendanceRes]) => {
        if (sessionRes?.data) setSessionDetail(sessionRes.data);
        
        if (attendanceRes?.success && attendanceRes.data) {
          const arr = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
          setList(arr);
          const init = {};
          arr.forEach((item) => {
            const id = item.student?._id;
            if (id) init[id] = { status: item.status || 'present', notes: item.notes || '' };
          });
          setAttendance(init);
        } else {
          setList([]);
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Level Routing - Render matching sub-pages
  if (!classId && !sessionId) return <TeacherAttendanceClassList navigate={navigate} />;
  if (classId && !sessionId) return <TeacherClassSessions classId={classId} navigate={navigate} />;

  const getAttendanceStatus = (sessionDate, sessionTime) => {
    if (!sessionDate || !sessionTime) return false;
    
    const [hours, minutes] = sessionTime.split(':').map(Number);
    const dStr = sessionDate instanceof Date ? sessionDate.toISOString().split('T')[0] : String(sessionDate).split('T')[0];
    const parts = dStr.split('-');
    const sessionStart = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), hours, minutes, 0, 0)
      : new Date(sessionDate);

    if (parts.length !== 3) {
      sessionStart.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const diffMs = now.getTime() - sessionStart.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= 0 && diffHours <= 24;
  };

  const isEditable = sessionDetail ? getAttendanceStatus(sessionDetail.date, sessionDetail.startTime) : false;

  const handleMarkAllPresent = () => {
      const updated = { ...attendance };
      Object.keys(updated).forEach(key => {
          updated[key].status = 'present';
      });
      setAttendance(updated);
  };

  const handleMarkAllAbsent = () => {
      const updated = { ...attendance };
      Object.keys(updated).forEach(key => {
          updated[key].status = 'absent';
      });
      setAttendance(updated);
  };

  const handleSubmit = async () => {
    if (Object.keys(attendance).length === 0) {
        setError('Không có học sinh để điểm danh');
        return;
    }
    
    setSubmitting(true);
    setError('');
    const attendanceList = Object.entries(attendance).map(([studentId, data]) => ({ studentId, ...data }));
    teacherApi.postSessionAttendanceBulk(sessionId, { attendanceList })
      .then((res) => {
        if (res?.success) {
          alert('Điểm danh thành công!');
          if (sessionDetail?.class?._id || sessionDetail?.class) {
             const clsId = sessionDetail.class._id || sessionDetail.class;
             navigate(`/teacher/attendances/class/${clsId}`);
          } else {
             navigate('/teacher/attendances');
          }
        } else setError(res?.message || 'Lưu thất bại');
      })
      .catch((err) => setError(err.response?.data?.message || 'Lưu thất bại'))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="max-w-[1600px] mx-auto fade-in pb-16">
      <div className="mb-6 flex justify-between items-center">
        <button 
            onClick={() => {
                if (sessionDetail?.class?._id || sessionDetail?.class) {
                const clsId = sessionDetail.class._id || sessionDetail.class;
                navigate(`/teacher/attendances/class/${clsId}`);
                } else {
                navigate('/teacher/attendances');
                }
            }} 
            className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại Buổi học
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-8 lg:p-10 border border-outline-variant/30 shadow-[0_12px_40px_rgba(0,0,0,0.04)] relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline leading-tight max-w-3xl">
                    Sổ Điểm Danh: {sessionDetail?.title || sessionId}
                </h1>
                
                {sessionDetail && (
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium">
                        <div className="bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-md flex items-center gap-2 border border-outline-variant/20 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {new Date(sessionDetail.date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-md flex items-center gap-2 border border-outline-variant/20 shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {sessionDetail.startTime} - {sessionDetail.endTime}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex shrink-0">
                {isEditable ? (
                     <div className="bg-emerald-50 text-emerald-800 px-4 py-3 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
                         <span className="material-symbols-outlined shrink-0 text-emerald-600 animate-pulse">lock_open</span>
                         <div>
                             <p className="font-bold text-sm">Đang mở cổng điểm danh</p>
                             <p className="text-xs opacity-80 mt-0.5">Bạn có 24h để hoàn tất</p>
                         </div>
                     </div>
                ) : (
                     <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-xl border border-amber-200 shadow-sm flex items-center gap-3">
                        <span className="material-symbols-outlined shrink-0 text-amber-600">lock</span>
                        <div>
                            <p className="font-bold text-sm">Chế độ Chỉ Xem (Read-only)</p>
                            <p className="text-xs opacity-80 mt-0.5">Cổng điểm danh đã đóng hoặc chưa mở.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-800 p-4 rounded-xl flex items-center gap-3 border border-red-200 shadow-sm">
            <span className="material-symbols-outlined">error</span>
            <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
          <p className="text-on-surface-variant font-bold text-sm tracking-widest uppercase">Đang tải danh sách học sinh...</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
            
          {/* Toolbar over table */}
          {isEditable && list.length > 0 && (
            <div className="bg-slate-50/50 border-b border-outline-variant/20 p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <p className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    Sĩ số: {list.length} học viên
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={handleMarkAllPresent}
                        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 px-3 py-1.5 rounded text-xs font-bold transition-colors border border-emerald-200 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[16px]">playlist_add_check</span>
                        Tất cả Có Mặt
                    </button>
                    <button 
                        onClick={handleMarkAllAbsent}
                        className="inline-flex items-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 px-3 py-1.5 rounded text-xs font-bold transition-colors border border-red-200 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[16px]">person_off</span>
                        Tất cả Vắng
                    </button>
                </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="p-4 border-b border-outline-variant/20 w-80">Học sinh</th>
                  <th className="p-4 border-b border-outline-variant/20 w-[420px]">Trạng thái Điểm danh</th>
                  <th className="p-4 border-b border-outline-variant/20">Ghi chú của GV</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {list.map((item) => {
                  const id = item.student?._id;
                  if (!id) return null;
                  const currentStatus = attendance[id]?.status || 'present';
                  
                  return (
                    <tr key={id} className="border-b border-outline-variant/10 hover:bg-surface/30 transition-colors">
                      <td className="p-4">
                          <div className="flex items-center gap-3 font-bold text-on-surface">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-1 ring-primary/20 shrink-0">
                                {item.student.firstName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p>{item.student.firstName} {item.student.lastName}</p>
                                <p className="text-[11px] font-medium text-on-surface-variant mt-0.5">{item.student.email}</p>
                            </div>
                          </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full" style={{minWidth: '350px'}}>
                          {STATUS_OPTIONS.map((o) => {
                              const isChecked = currentStatus === o.value;
                              
                              let bgClass = "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30";
                              if (isChecked) {
                                  if (o.value === 'present') bgClass = "bg-emerald-50 text-emerald-700 font-bold border-emerald-500/50 shadow-sm ring-2 ring-emerald-500/20";
                                  if (o.value === 'absent') bgClass = "bg-red-50 text-red-700 font-bold border-red-500/50 shadow-sm ring-2 ring-red-500/20";
                              }
                              
                              return (
                                <button
                                    key={o.value}
                                    type="button"
                                    disabled={!isEditable}
                                    onClick={() => setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], status: o.value } }))}
                                    className={`inline-flex items-center justify-center min-w-[120px] max-w-[150px] gap-2 px-4 py-2.5 rounded-xl border transition-all select-none focus:outline-none ${bgClass} ${!isEditable ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                                >
                                    <span className={`material-symbols-outlined text-[18px] ${isChecked ? 'filled' : ''}`} style={isChecked ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                        {o.icon}
                                    </span>
                                    {o.label}
                                </button>
                              );
                          })}
                        </div>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <input
                          type="text"
                          className="w-full bg-surface border border-outline-variant/50 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:bg-surface-container-low disabled:text-on-surface-variant disabled:cursor-not-allowed"
                          placeholder="Lý do vắng, đi trễ, nghỉ có phép..."
                          value={attendance[id]?.notes || ''}
                          onChange={(e) => setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], notes: e.target.value } }))}
                          disabled={!isEditable}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {list.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl opacity-30">hourglass_empty</span>
                    <p className="font-medium">Chưa có danh sách sinh viên.</p>
                </div>
            )}
          </div>
          
          {isEditable && list.length > 0 && (
             <div className="p-6 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4 bg-primary/5">
                 <p className="text-sm font-bold text-primary flex items-center gap-2">
                     <span className="material-symbols-outlined text-[20px]">info</span>
                     Hãy chắc chắn bạn đã rà soát danh sách trước khi lưu!
                 </p>
                 <button 
                    type="button" 
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-primary-container transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed" 
                    onClick={handleSubmit} 
                    disabled={submitting}
                >
                   {submitting ? (
                       <><span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> Đang lưu...</>
                   ) : (
                       <><span className="material-symbols-outlined text-[20px]">save</span> Lưu Điểm Danh</>
                   )}
                 </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
