import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

export default function TeacherClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'sessions'

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      teacherApi.getClassById(id),
      teacherApi.getClassStudents(id),
      teacherApi.getSessionsByClassId(id)
    ])
      .then(([classRes, studentsRes, sessionsRes]) => {
        if (classRes?.data) setClassInfo(classRes.data);
        if (studentsRes?.data) setStudents(studentsRes.data);
        if (sessionsRes?.data) setSessions(sessionsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return <div className="page-card"><p>Đang tải dữ liệu lớp học...</p></div>;
  }

  if (!classInfo) {
    return <div className="page-card"><p className="error-msg">Không tìm thấy thông tin lớp học.</p></div>;
  }

  return (
    <div className="page-card">
      <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
         <button className="btn-secondary" onClick={() => navigate('/teacher/classes')}>
            ← Quay lại
         </button>
         <h1 className="page-title" style={{ margin: 0 }}>
            {classInfo.name} <span style={{ fontSize: '1rem', color: '#64748b' }}>({classInfo.code})</span>
         </h1>
      </div>

      <div className="toolbar" style={{ marginBottom: '20px' }}>
        <button 
          type="button" 
          className={activeTab === 'students' ? 'active' : ''} 
          onClick={() => setActiveTab('students')}
        >
          Danh sách Sinh viên ({students.length})
        </button>
        <button 
          type="button" 
          className={activeTab === 'sessions' ? 'active' : ''} 
          onClick={() => setActiveTab('sessions')}
        >
          Lịch trình ({sessions.length})
        </button>
      </div>

      {activeTab === 'students' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ và Tên</th>
                <th>Email</th>
                <th>SĐT</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id}>
                  <td>{s.firstName} {s.lastName}</td>
                  <td>{s.email}</td>
                  <td>{s.phone || s.phoneNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <p className="empty">Chưa có sinh viên nào trong lớp.</p>}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Buổi học</th>
                <th>Ngày</th>
                <th>Giờ học</th>
                <th>Phòng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s._id}>
                  <td>{s.title}</td>
                  <td>{formatDate(s.date)}</td>
                  <td>{s.startTime} - {s.endTime}</td>
                  <td>{s.room?.name || s.room || '-'}</td>
                  <td>
                     <button className="link" onClick={() => navigate(`/teacher/attendances/${s._id}`)}>
                        Điểm danh
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && <p className="empty">Lớp chưa có buổi học nào.</p>}
        </div>
      )}
    </div>
  );
}
