import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timetableApi } from '../api/timetableApi';
import { SLOT_DEFINITIONS, getSlotByNumber } from '../constants/slots';
import './Timetable.css';

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
      ? `${slotDef.label} · ${slotDef.startTime}–${slotDef.endTime}`
      : (session.startTime && session.endTime ? `${session.startTime} - ${session.endTime}` : '');
    return (
      <div
        key={session._id}
        className={`session-card ${role === 'admin' ? 'clickable' : ''}`}
        onClick={() => openEditModal(session)}
      >
        <div className="session-time">{timeLabel}</div>
        <div className="session-title">{session.title}</div>
        <div className="session-class">{session.class?.name || 'Unknown Class'}</div>
        {session.teacher && (
          <div className="session-teacher">👤 {session.teacher.firstName} {session.teacher.lastName}</div>
        )}
        {session.room && <div className="session-room">📍 {session.room}</div>}
        <div className="session-badges">
           <div className={`session-status status-${session.status}`}>{session.status}</div>
           {role === 'student' && session.attendanceStatus && (
             <div className={`attendance-status att-${session.attendanceStatus}`}>
               {ATTENDANCE_LABEL[session.attendanceStatus] || session.attendanceStatus}
             </div>
           )}
           {session.isMakeup && <div className="session-makeup-badge">Học bù</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <div className="title-section">
          <h2>Weekly Timetable</h2>
          {role === 'admin' && (
            <div className="admin-actions">
              <button className="btn-primary" onClick={openCreateModal}>+ New Session</button>
              <button className="btn-secondary" onClick={() => setIsGenerateModalOpen(true)}>Generate Sessions</button>
            </div>
          )}
        </div>
        <div className="week-controls">
          <button onClick={handlePrevWeek}>&lt; Prev Week</button>
          <span className="current-week">
            {timetableData ? `Week of ${timetableData.week.start}` : 'Loading...'}
          </span>
          <button onClick={handleNextWeek}>Next Week &gt;</button>
        </div>
      </div>

      {role === 'admin' && !fixedClassId && (
        <div className="admin-filters">
           <input 
              type="text" 
              placeholder="Filter by Class ID" 
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
           />
           <input 
              type="text" 
              placeholder="Filter by Teacher ID" 
              value={targetTeacherId}
              onChange={(e) => setTargetTeacherId(e.target.value)}
           />
           <button onClick={fetchTimetable} className="btn-filter">Apply</button>
        </div>
      )}

      {error && <div className="error-alert">{error}</div>}

      <div className="day-tabs-mobile">
        {DAY_NAMES.map(day => (
          <button 
             key={day} 
             className={`tab-btn ${activeDayTab === day ? 'active' : ''}`}
             onClick={() => setActiveDayTab(day)}
          >
             {day.substring(0,3)}
          </button>
        ))}
      </div>

      <div className="timetable-grid">
        {DAY_NAMES.map((day, index) => {
          const isEmpty = !timetableData?.timetable[day] || timetableData.timetable[day].length === 0;

          // Calculate specific date string for this column
          const dObj = new Date(currentDate);
          dObj.setDate(currentDate.getDate() + index);
          const colDateStr = `${dObj.getFullYear()}-${String(dObj.getMonth()+1).padStart(2,'0')}-${String(dObj.getDate()).padStart(2,'0')}`;
          
          const isToday = colDateStr === todayStr;

          return (
             <div key={day} className={`day-column ${isToday ? 'is-today' : ''} ${activeDayTab !== day ? 'hidden-on-mobile' : ''}`}>
               <div className="day-header">
                  {day} <br/> 
                  <span className="date-subtext">{colDateStr.slice(5).replace('-','/')}</span>
                  {isToday && <span className="today-badge">Hôm nay</span>}
               </div>
               
               <div className="day-content">
                 {loading ? (
                    <div className="loading-placeholder">Đang tải...</div>
                 ) : !isEmpty ? (
                   timetableData.timetable[day].map(renderSessionCard)
                 ) : (
                   <div className="empty-day">Trống</div>
                 )}
               </div>
             </div>
          );
        })}
      </div>

      {/* Session Modal */}
      {isSessionModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingSession ? 'Edit Session' : 'Create New Session'}</h3>
            <form onSubmit={handleSaveSession}>
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={sessionForm.title} onChange={e => setSessionForm({...sessionForm, title: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class</label>
                  <select 
                    value={sessionForm.class} 
                    onChange={e => setSessionForm({...sessionForm, class: e.target.value})} 
                    required
                    disabled={!!fixedClassId}
                  >
                    <option value="">Select Class</option>
                    {classList.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Session Number</label>
                  <input type="number" value={sessionForm.sessionNumber} onChange={e => setSessionForm({...sessionForm, sessionNumber: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label>Teacher</label>
                <select value={sessionForm.teacherId} onChange={e => setSessionForm({...sessionForm, teacherId: e.target.value})} required>
                  <option value="">Select Teacher</option>
                  {teacherList.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày</label>
                  <input type="date" value={sessionForm.date} onChange={e => setSessionForm({...sessionForm, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phòng</label>
                  <select value={sessionForm.room} onChange={e => setSessionForm({...sessionForm, room: e.target.value})}>
                    <option value="">-- Chọn phòng --</option>
                    {editingSession && editingSession.room && !availableRooms.find(r => r.name === editingSession.room) && (
                       <option value={editingSession.room}>{editingSession.room} (Đang chọn)</option>
                    )}
                    {availableRooms.map(r => <option key={r._id} value={r.name}>{r.name} {r.capacity ? `(${r.capacity} chỗ)` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Slot thời gian</label>
                <select value={sessionForm.slotNumber} onChange={e => setSessionForm({...sessionForm, slotNumber: Number(e.target.value)})} required>
                  {SLOT_DEFINITIONS.map(s => (
                    <option key={s.slotNumber} value={s.slotNumber}>
                      {s.label} · {s.startTime}–{s.endTime} ({s.period})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={sessionForm.status} onChange={e => setSessionForm({...sessionForm, status: e.target.value})}>
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {sessionForm.status === 'cancelled' && (
                <div className="form-group">
                  <label>Lý do huỷ</label>
                  <input type="text" value={sessionForm.cancelReason} onChange={e => setSessionForm({...sessionForm, cancelReason: e.target.value})} placeholder="VD: Nghỉ lễ, Giáo viên ốm..." />
                </div>
              )}
              <div className="modal-actions">
                {editingSession && (
                  <button type="button" className="btn-danger" onClick={handleDeleteSession}>Delete</button>
                )}
                {editingSession && editingSession.status === 'cancelled' && (
                  <button type="button" className="btn-secondary" onClick={openMakeupModal} style={{marginLeft: '10px'}}>+ Tạo buổi học bù</button>
                )}
                <div className="right-actions">
                  <button type="button" onClick={() => setIsSessionModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Generate Sessions from Template</h3>
            <p className="modal-subtitle">Automatically create sessions for a class based on a template schedule.</p>
            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label>Class</label>
                <select value={generateForm.classId} onChange={e => setGenerateForm({...generateForm, classId: e.target.value})} required>
                  <option value="">Select Class</option>
                  {classList.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Schedule Template</label>
                <select value={generateForm.templateId} onChange={e => setGenerateForm({...generateForm, templateId: e.target.value})} required>
                  <option value="">Select Template</option>
                  {templateList.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={generateForm.startDate} onChange={e => setGenerateForm({...generateForm, startDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={generateForm.endDate} onChange={e => setGenerateForm({...generateForm, endDate: e.target.value})} />
                </div>
              </div>
              <p className="hint-text">If dates are empty, class start/end dates will be used.</p>
              <div className="modal-actions">
                <button type="button" onClick={() => setIsGenerateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make-up Session Modal */}
      {isMakeupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Tạo Buổi Học Bù</h3>
            <p className="modal-subtitle">Bù cho: {editingSession?.title} - {editingSession?.class?.name}</p>
            <form onSubmit={handleCreateMakeup}>
              <div className="form-group">
                <label>Giáo viên dạy bù</label>
                <select value={makeupForm.teacherId} onChange={e => setMakeupForm({...makeupForm, teacherId: e.target.value})} required>
                  <option value="">Select Teacher</option>
                  {teacherList.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngày học bù</label>
                  <input type="date" value={makeupForm.date} onChange={e => setMakeupForm({...makeupForm, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phòng học</label>
                  <select value={makeupForm.room} onChange={e => setMakeupForm({...makeupForm, room: e.target.value})}>
                    <option value="">-- Chọn phòng --</option>
                    {availableRooms.map(r => <option key={r._id} value={r.name}>{r.name} {r.capacity ? `(${r.capacity} chỗ)` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Slot thời gian</label>
                <select value={makeupForm.slotNumber} onChange={e => setMakeupForm({...makeupForm, slotNumber: Number(e.target.value)})} required>
                  {SLOT_DEFINITIONS.map(s => (
                    <option key={s.slotNumber} value={s.slotNumber}>
                      {s.label} · {s.startTime}–{s.endTime} ({s.period})
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <div className="right-actions">
                  <button type="button" onClick={() => setIsMakeupModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Tạo lịch</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
