import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timetableApi } from '../api/timetableApi';
import { SLOT_DEFINITIONS, getSlotByNumber } from '../constants/slots';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ATTENDANCE_LABEL = {
  present: 'Present',
  absent: 'Absent',
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0) ? -6 : 1 - day; // go back to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const Timetable = ({ role, fixedClassId }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(getMonday(new Date()));
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDayTab, setActiveDayTab] = useState(DAY_NAMES[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  const todayStr = React.useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }, []);

  // Admin specific filters
  const [targetClassId, setTargetClassId] = useState(fixedClassId || '');
  const [targetTeacherId, setTargetTeacherId] = useState('');

  // Modals state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    title: '',
    class: '',
    teacherId: '',
    sessionNumber: '',
    date: '',
    slotNumber: 1,
    room: '',
    status: 'scheduled',
    cancelReason: ''
  });

  const [makeupForm, setMakeupForm] = useState({
    date: '',
    slotNumber: 1,
    room: '',
    teacherId: ''
  });

  const [generateForm, setGenerateForm] = useState({
    classId: '',
    templateId: '',
    startDate: '',
    endDate: ''
  });

  // Master data for dropdowns
  const [classList, setClassList] = useState([]);
  const [teacherList, setTeacherList] = useState([]);
  const [templateList, setTemplateList] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  const fetchTimetable = async () => {
    setLoading(true);
    setError('');
    try {
      // Format as local YYYY-MM-DD (avoid UTC shift from toISOString on +07:00)
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const formattedDate = `${y}-${m}-${dd}`;
      const params = { weekStart: formattedDate };
      
      if (role === 'admin') {
         if (targetClassId) params.classId = targetClassId;
         if (targetTeacherId) params.teacherId = targetTeacherId;
      }

      let res;
      if (role === 'admin') {
        res = await timetableApi.getAdminTimetable(params);
      } else if (role === 'teacher') {
        res = await timetableApi.getTeacherTimetable(params);
      } else if (role === 'student') {
        res = await timetableApi.getStudentTimetable(params);
      }

      if (res.success) {
        setTimetableData(res.data);
      } else {
        setError('Failed to load timetable data.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while fetching the timetable.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    if (role !== 'admin') return;
    try {
      const [classesRes, teachersRes, templatesRes] = await Promise.all([
        timetableApi.getAdminClasses(),
        timetableApi.getAdminTeachers(),
        timetableApi.getTemplates()
      ]);

      if (classesRes.success) setClassList(classesRes.data.classes || []);
      if (teachersRes.success) setTeacherList(teachersRes.data || []);
      if (templatesRes.success) setTemplateList(templatesRes.data || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  useEffect(() => {
    if (isSessionModalOpen && sessionForm.date && sessionForm.slotNumber) {
      timetableApi.getAvailableRooms({
        date: sessionForm.date,
        slotNumber: sessionForm.slotNumber,
        excludeSessionId: editingSession ? editingSession._id : undefined
      }).then(res => {
        if (res.success) setAvailableRooms(res.data);
      }).catch(err => console.error(err));
    }
  }, [isSessionModalOpen, sessionForm.date, sessionForm.slotNumber, editingSession]);

  useEffect(() => {
    if (isMakeupModalOpen && makeupForm.date && makeupForm.slotNumber) {
      timetableApi.getAvailableRooms({
        date: makeupForm.date,
        slotNumber: makeupForm.slotNumber
      }).then(res => {
        if (res.success) setAvailableRooms(res.data);
      }).catch(err => console.error(err));
    }
  }, [isMakeupModalOpen, makeupForm.date, makeupForm.slotNumber]);

  useEffect(() => {
    fetchTimetable();
  }, [currentDate, role, targetClassId, targetTeacherId]);

  useEffect(() => {
    fetchMasterData();
  }, [role]);

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const getWeekLabel = () => {
    const startOfWeek = getMonday(new Date());
    const diff = Math.round((currentDate.getTime() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    if (diff === 0) return 'Tuần này';
    if (diff === 1) return 'Tuần tới';
    if (diff === -1) return 'Tuần trước';
    
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(currentDate.getDate() + 6);
    const fmt = (d) => `${d.getDate()}/${d.getMonth()+1}`;
    return `${fmt(currentDate)} - ${fmt(endOfWeek)}`;
  };

  const resetToToday = () => {
    setCurrentDate(getMonday(new Date()));
  };

  const openEditModal = (session) => {
    if (role !== 'admin') return;
    setEditingSession(session);
    setSessionForm({
      title: session.title || '',
      class: session.class?._id || '',
      teacherId: session.teacher?._id || '',
      sessionNumber: session.sessionNumber || '',
      date: session.date ? new Date(session.date).toISOString().split('T')[0] : '',
      slotNumber: session.slotNumber || 1,
      room: session.room || '',
      status: session.status || 'scheduled',
      cancelReason: session.cancelReason || ''
    });
    setIsSessionModalOpen(true);
  };

  const openMakeupModal = () => {
    setMakeupForm({
      date: new Date().toISOString().split('T')[0],
      slotNumber: editingSession?.slotNumber || 1,
      room: editingSession?.room || '',
      teacherId: editingSession?.teacher?._id || ''
    });
    setIsSessionModalOpen(false);
    setIsMakeupModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingSession(null);
    setSessionForm({
      title: '',
      class: fixedClassId || targetClassId || classList[0]?._id || '',
      teacherId: teacherList[0]?._id || '',
      sessionNumber: '',
      date: new Date().toISOString().split('T')[0],
      slotNumber: 1,
      room: '',
      status: 'scheduled',
      cancelReason: ''
    });
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    try {
      let res;
      const slotDef = getSlotByNumber(sessionForm.slotNumber) || {};
      const payload = {
        ...sessionForm,
        // Backend Session schema uses `teacher` field (ObjectId), not `teacherId`
        teacher: sessionForm.teacherId || undefined,
        startTime: slotDef.startTime || '',
        endTime: slotDef.endTime || ''
      };
      delete payload.teacherId;

      if (editingSession) {
        res = await timetableApi.updateSession(editingSession._id, payload);
      } else {
        res = await timetableApi.createSession(payload);
      }
      
      if (res.success) {
        setIsSessionModalOpen(false);
        fetchTimetable();
      } else {
        alert(res.message || 'Error saving session');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.details?.join(', ') || err.response?.data?.message || 'Error saving session';
      alert(errorMsg);
    }
  };

  const handleDeleteSession = async () => {
    if (!editingSession || !window.confirm('Are you sure you want to delete this session?')) return;
    try {
      const res = await timetableApi.deleteSession(editingSession._id);
      if (res.success) {
        setIsSessionModalOpen(false);
        fetchTimetable();
      }
    } catch (err) {
      alert('Error deleting session');
    }
  };

  const handleCreateMakeup = async (e) => {
    e.preventDefault();
    if (!editingSession) return;
    try {
      const res = await timetableApi.createMakeupSession(editingSession._id, makeupForm);
      if (res.success) {
        setIsMakeupModalOpen(false);
        fetchTimetable();
        alert('Make-up session created successfully');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.details?.join(', ') || err.response?.data?.message || 'Error creating make-up session';
      alert(errorMsg);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await timetableApi.generateSessions(generateForm);
      if (res.success) {
        setIsGenerateModalOpen(false);
        alert(`Successfully generated ${res.data.length} sessions`);
        fetchTimetable();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating sessions');
    }
  };

  const renderSessionCard = (session) => {
    const slotDef = session.slotNumber ? getSlotByNumber(session.slotNumber) : null;
    const timeLabel = slotDef
      ? `${slotDef.startTime}–${slotDef.endTime}`
      : (session.startTime && session.endTime ? `${session.startTime} - ${session.endTime}` : '');

    let statusColor = 'bg-surface-container text-on-surface';
    let borderColor = 'border-l-outline-variant';
    
    if (session.status === 'completed') { statusColor = 'bg-emerald-100 text-emerald-800'; borderColor = 'border-l-emerald-500'; }
    if (session.status === 'scheduled') { statusColor = 'bg-blue-100 text-blue-800'; borderColor = 'border-l-blue-500'; }
    if (session.status === 'ongoing') { statusColor = 'bg-amber-100 text-amber-800'; borderColor = 'border-l-amber-500'; }
    if (session.status === 'cancelled') { statusColor = 'bg-red-100 text-red-800'; borderColor = 'border-l-red-500'; }

    return (
      <div
        key={session._id}
        className={`group bg-surface-container-lowest p-3 rounded-xl shadow-sm border border-outline-variant/15 border-l-4 ${borderColor} hover:shadow-md transition-all cursor-[pointer] relative overflow-hidden ${role === 'admin' ? 'hover:-translate-y-0.5' : ''}`}
        onClick={() => openEditModal(session)}
      >
        <div className="flex justify-between items-start mb-2 gap-1">
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-tighter">{timeLabel}</span>
          <span className={`px-2 py-0.5 flex-shrink-0 ${statusColor} text-[9px] font-bold rounded-full uppercase tracking-wider`}>
            {session.status}
          </span>
        </div>
        <h4 className="text-xs font-bold leading-tight mb-2 text-on-surface">{session.title}</h4>
        
        <div className="text-[10px] text-on-surface-variant font-medium space-y-1 mb-2">
            <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">school</span> <span className="truncate">{session.class?.name || 'Unknown'}</span></div>
            {session.teacher && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">person</span> <span className="truncate">{session.teacher.firstName}</span></div>}
            {session.room && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">room</span> <span className="truncate">{session.room}</span></div>}
        </div>
        
        {(session.attendanceStatus || session.isMakeup) && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-outline-variant/10">
            {role === 'student' && session.attendanceStatus && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${session.attendanceStatus === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {ATTENDANCE_LABEL[session.attendanceStatus] || session.attendanceStatus}
              </span>
            )}
            {session.isMakeup && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[9px] font-bold rounded uppercase tracking-wider">Học bù</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto fade-in pb-16">
      {/* Header Controls Section */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-on-surface font-headline">Lịch học & Giảng dạy</h1>
          <p className="text-on-surface-variant font-medium font-body flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">calendar_month</span>
             {timetableData ? `Tuần từ ${timetableData.week.start}` : 'Đang tải...'}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 items-end">
            {role === 'admin' && (
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-primary text-white rounded-lg font-bold shadow-sm shadow-primary/30 hover:bg-primary-container transition-all" onClick={openCreateModal}>+ Tạo Buổi Học</button>
                    <button className="px-5 py-2.5 bg-surface-container-low text-on-surface border border-outline-variant/30 rounded-lg font-bold hover:bg-surface-container transition-all" onClick={() => setIsGenerateModalOpen(true)}>Generate Auto</button>
                </div>
            )}
            <div className="flex items-center bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/20 whisper-shadow inline-flex">
                <button onClick={handlePrevWeek} className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-lowest"><span className="material-symbols-outlined">chevron_left</span></button>
                <div 
                  onClick={resetToToday}
                  className="px-4 text-xs font-extrabold bg-surface-container-lowest text-primary shadow-sm rounded-lg py-2 cursor-pointer hover:bg-primary/5 transition-colors min-w-[100px] text-center"
                >
                  {getWeekLabel()}
                </div>
                <button onClick={handleNextWeek} className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container-lowest"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
        </div>
      </div>

      {role === 'admin' && !fixedClassId && (
        <div className="flex gap-4 mb-8 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm flex-wrap">
           <input 
              type="text" 
              className="flex-1 min-w-[200px] border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Lọc theo Class ID..." 
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
           />
           <input 
              type="text" 
              className="flex-1 min-w-[200px] border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Lọc theo Teacher ID..." 
              value={targetTeacherId}
              onChange={(e) => setTargetTeacherId(e.target.value)}
           />
           <button onClick={fetchTimetable} className="px-6 py-2.5 bg-on-surface text-white rounded-lg font-bold hover:opacity-90 transition-all shadow-sm">Áp dụng bộ lọc</button>
        </div>
      )}

      {error && <div className="p-4 bg-error-container text-on-error-container rounded-lg font-medium text-sm mb-6 border border-error/20 flex gap-2"><span className="material-symbols-outlined">error</span> {error}</div>}

      <div className="flex md:hidden gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
        {DAY_NAMES.map(day => (
          <button 
             key={day} 
             className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all border ${activeDayTab === day ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:border-outline'}`}
             onClick={() => setActiveDayTab(day)}
          >
             {day}
          </button>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-outline-variant/30 rounded-2xl overflow-hidden border border-outline-variant/30 shadow-sm">
        {DAY_NAMES.map((day, index) => {
          const isEmpty = !timetableData?.timetable[day] || timetableData.timetable[day].length === 0;

          const dObj = new Date(currentDate);
          dObj.setDate(currentDate.getDate() + index);
          const colDateStr = `${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}-${String(dObj.getDate()).padStart(2,'0')}`;
          
          const isToday = colDateStr === todayStr;

          return (
             <div key={day} className={`flex flex-col min-h-[600px] bg-surface ${isToday ? 'relative z-10' : ''} ${activeDayTab !== day ? 'hidden md:flex' : 'flex'}`}>
               <div className={`p-4 text-center border-b border-outline-variant/10 ${isToday ? 'bg-primary-fixed' : 'bg-surface-container-lowest'}`}>
                  <span className={`block text-[11px] uppercase tracking-widest font-bold mb-1 ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{day.substring(0, 3)}</span>
                  <span className={`text-2xl font-extrabold font-headline ${isToday ? 'text-primary block' : 'text-on-surface block'}`}>{new Date(colDateStr).getDate()}</span>
                  {isToday && <span className="block text-[9px] font-extrabold text-white bg-primary rounded-full uppercase mt-2 w-fit mx-auto px-3 py-1 tracking-widest shadow-sm">Hôm nay</span>}
               </div>
               
               <div className={`p-2.5 flex flex-col gap-2.5 flex-1 ${isToday ? 'bg-primary-fixed/10' : 'bg-surface-container-lowest'}`}>
                 {loading ? (
                    <div className="py-10 text-center text-on-surface-variant text-xs font-semibold animate-pulse">Đang tải...</div>
                 ) : !isEmpty ? (
                   timetableData.timetable[day].map(renderSessionCard)
                 ) : (
                   <div className="h-full flex items-center justify-center opacity-40">
                      <span className="text-on-surface-variant text-[11px] font-semibold uppercase tracking-widest">Trống</span>
                   </div>
                 )}
               </div>
             </div>
          );
        })}
      </div>

      {/* Session Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-lg p-8 relative overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline font-extrabold text-xl text-on-surface">{editingSession ? 'Chỉnh sửa buổi học' : 'Tạo buổi học mới'}</h3>
              <button type="button" onClick={() => setIsSessionModalOpen(false)} className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Tên buổi học</label>
                <input type="text" value={sessionForm.title} onChange={e => setSessionForm({...sessionForm, title: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Lớp</label>
                  <select value={sessionForm.class} onChange={e => setSessionForm({...sessionForm, class: e.target.value})} required disabled={!!fixedClassId} className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                    <option value="">Chọn lớp...</option>
                    {classList.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Số buổi</label>
                  <input type="number" value={sessionForm.sessionNumber} onChange={e => setSessionForm({...sessionForm, sessionNumber: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Giáo viên</label>
                <select value={sessionForm.teacherId} onChange={e => setSessionForm({...sessionForm, teacherId: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  <option value="">Chọn giáo viên...</option>
                  {teacherList.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Ngày</label>
                  <input type="date" value={sessionForm.date} onChange={e => setSessionForm({...sessionForm, date: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Phòng</label>
                  <select value={sessionForm.room} onChange={e => setSessionForm({...sessionForm, room: e.target.value})} className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                    <option value="">-- Chọn phòng --</option>
                    {editingSession && editingSession.room && !availableRooms.find(r => r.name === editingSession.room) && (
                       <option value={editingSession.room}>{editingSession.room} (Đang dùng)</option>
                    )}
                    {availableRooms.map(r => <option key={r._id} value={r.name}>{r.name} {r.capacity ? `(${r.capacity} chỗ)` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Slot thời gian</label>
                <select value={sessionForm.slotNumber} onChange={e => setSessionForm({...sessionForm, slotNumber: Number(e.target.value)})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  {SLOT_DEFINITIONS.map(s => (
                    <option key={s.slotNumber} value={s.slotNumber}>
                      {s.label} · {s.startTime}–{s.endTime} ({s.period})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Trạng thái</label>
                <select value={sessionForm.status} onChange={e => setSessionForm({...sessionForm, status: e.target.value})} className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  <option value="scheduled">Đã lên lịch</option>
                  <option value="ongoing">Đang diễn ra</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã huỷ</option>
                </select>
              </div>
              {sessionForm.status === 'cancelled' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Lý do huỷ</label>
                  <input type="text" value={sessionForm.cancelReason} onChange={e => setSessionForm({...sessionForm, cancelReason: e.target.value})} placeholder="VD: Nghỉ lễ, Giáo viên ốm..." className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 gap-3">
                <div className="flex gap-2">
                  {editingSession && (
                    <button type="button" className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors" onClick={handleDeleteSession}>Xoá</button>
                  )}
                  {editingSession && editingSession.status === 'cancelled' && (
                    <button type="button" className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-sm hover:bg-purple-100 transition-colors" onClick={openMakeupModal}>+ Tạo buổi bù</button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsSessionModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors">Huỷ</button>
                  <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-container transition-all shadow-sm shadow-primary/20">Lưu</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline font-extrabold text-xl text-on-surface">Tạo lịch tự động</h3>
              <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">Tự động tạo các buổi học cho lớp theo mẫu lịch.</p>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Lớp học</label>
                <select value={generateForm.classId} onChange={e => setGenerateForm({...generateForm, classId: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  <option value="">Chọn lớp học...</option>
                  {classList.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Mẫu lịch học</label>
                <select value={generateForm.templateId} onChange={e => setGenerateForm({...generateForm, templateId: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  <option value="">Chọn mẫu lịch...</option>
                  {templateList.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Ngày bắt đầu</label>
                  <input type="date" value={generateForm.startDate} onChange={e => setGenerateForm({...generateForm, startDate: e.target.value})} className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Ngày kết thúc</label>
                  <input type="date" value={generateForm.endDate} onChange={e => setGenerateForm({...generateForm, endDate: e.target.value})} className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <p className="text-xs text-on-surface-variant/60 italic">Nếu để trống, hệ thống sẽ dùng ngày khai giảng và kết thúc của lớp.</p>
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors">Huỷ</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-container transition-all shadow-sm shadow-primary/20">Tạo lịch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make-up Session Modal */}
      {isMakeupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline font-extrabold text-xl text-on-surface">Tạo Buổi Học Bù</h3>
              <button type="button" onClick={() => setIsMakeupModalOpen(false)} className="text-on-surface-variant hover:text-on-surface rounded-full p-1 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 bg-purple-50 text-purple-800 border border-purple-100 rounded-xl px-4 py-2 font-medium">
              Bù cho: <span className="font-bold">{editingSession?.title}</span> — {editingSession?.class?.name}
            </p>
            <form onSubmit={handleCreateMakeup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Giáo viên dạy bù</label>
                <select value={makeupForm.teacherId} onChange={e => setMakeupForm({...makeupForm, teacherId: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  <option value="">Chọn giáo viên...</option>
                  {teacherList.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Ngày học bù</label>
                  <input type="date" value={makeupForm.date} onChange={e => setMakeupForm({...makeupForm, date: e.target.value})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Phòng học</label>
                  <select value={makeupForm.room} onChange={e => setMakeupForm({...makeupForm, room: e.target.value})} className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                    <option value="">-- Chọn phòng --</option>
                    {availableRooms.map(r => <option key={r._id} value={r.name}>{r.name} {r.capacity ? `(${r.capacity} chỗ)` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">Slot thời gian</label>
                <select value={makeupForm.slotNumber} onChange={e => setMakeupForm({...makeupForm, slotNumber: Number(e.target.value)})} required className="w-full bg-surface border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                  {SLOT_DEFINITIONS.map(s => (
                    <option key={s.slotNumber} value={s.slotNumber}>
                      {s.label} · {s.startTime}–{s.endTime} ({s.period})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/20">
                <button type="button" onClick={() => setIsMakeupModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-colors">Huỷ</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-container transition-all shadow-sm shadow-primary/20">Tạo lịch bù</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
