import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timetableApi } from '../api/timetableApi';
import './Timetable.css';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(date.setDate(diff));
};

const Timetable = ({ role }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(getMonday(new Date()));
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin specific filters
  const [targetClassId, setTargetClassId] = useState('');
  const [targetTeacherId, setTargetTeacherId] = useState('');

  // Modals state
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    title: '',
    class: '',
    teacherId: '',
    sessionNumber: '',
    date: '',
    startTime: '',
    endTime: '',
    room: '',
    status: 'scheduled'
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

  const fetchTimetable = async () => {
    setLoading(true);
    setError('');
    try {
      const formattedDate = currentDate.toISOString().split('T')[0];
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
      startTime: session.startTime || '',
      endTime: session.endTime || '',
      room: session.room || '',
      status: session.status || 'scheduled'
    });
    setIsSessionModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingSession(null);
    setSessionForm({
      title: '',
      class: classList[0]?._id || '',
      teacherId: teacherList[0]?._id || '',
      sessionNumber: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '10:00',
      room: '',
      status: 'scheduled'
    });
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editingSession) {
        res = await timetableApi.updateSession(editingSession._id, sessionForm);
      } else {
        res = await timetableApi.createSession(sessionForm);
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

  const renderSessionCard = (session) => (
    <div 
      key={session._id} 
      className={`session-card ${role === 'admin' ? 'clickable' : ''}`}
      onClick={() => openEditModal(session)}
    >
      <div className="session-time">
        {session.startTime} - {session.endTime}
      </div>
      <div className="session-title">{session.title}</div>
      <div className="session-class">{session.class?.name || 'Unknown Class'}</div>
      {role !== 'teacher' && session.teacher && (
        <div className="session-teacher">👤 {session.teacher.firstName} {session.teacher.lastName}</div>
      )}
      {session.room && <div className="session-room">📍 {session.room}</div>}
      <div className={`session-status status-${session.status}`}>
        {session.status}
      </div>
    </div>
  );

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

      {role === 'admin' && (
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

      <div className="timetable-grid">
        {DAY_NAMES.map(day => (
          <div key={day} className="day-column">
            <div className="day-header">{day}</div>
            <div className="day-content">
              {loading ? (
                 <div className="loading-placeholder">Loading...</div>
              ) : timetableData?.timetable[day]?.length > 0 ? (
                timetableData.timetable[day].map(renderSessionCard)
              ) : (
                <div className="empty-day">-</div>
              )}
            </div>
          </div>
        ))}
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
                  <select value={sessionForm.class} onChange={e => setSessionForm({...sessionForm, class: e.target.value})} required>
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
                  <label>Date</label>
                  <input type="date" value={sessionForm.date} onChange={e => setSessionForm({...sessionForm, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <input type="text" value={sessionForm.room} onChange={e => setSessionForm({...sessionForm, room: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="time" value={sessionForm.startTime} onChange={e => setSessionForm({...sessionForm, startTime: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="time" value={sessionForm.endTime} onChange={e => setSessionForm({...sessionForm, endTime: e.target.value})} required />
                </div>
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
              <div className="modal-actions">
                {editingSession && (
                  <button type="button" className="btn-danger" onClick={handleDeleteSession}>Delete</button>
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
                <button type="button" onClick={() => setIsGenerateModalOpen(true)}>Cancel</button>
                <button type="submit" className="btn-primary">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
