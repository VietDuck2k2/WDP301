import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import Timetable from '../Timetable';
import './ClassDetail.css';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [teacherOptions, setTeacherOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Generate TKB state
  const [templates, setTemplates] = useState([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({ templateId: '' });
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const fetchClassData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, memberRes, teacherRes, studentRes, tplRes] = await Promise.all([
        adminApi.getClassById(id),
        adminApi.getClassMembers(id, memberRoleFilter),
        adminApi.getUsersByRole('teacher'),
        adminApi.getUsersByRole('student'),
        adminApi.getScheduleTemplates(),
      ]);
      if (classRes?.success) setClassData(classRes.data);
      if (memberRes?.success) setMembers(memberRes.data || []);
      if (teacherRes?.success) setTeacherOptions(teacherRes.data || []);
      if (studentRes?.success) setStudentOptions(studentRes.data || []);
      if (tplRes?.success) setTemplates(tplRes.data || []);
    } catch (error) {
      console.error('Failed to fetch class detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id, memberRoleFilter]);

  useEffect(() => { fetchClassData(); }, [fetchClassData]);

  const stats = useMemo(() => {
    const teachers = members.filter(m => m.role === 'teacher').length;
    const students = members.filter(m => m.role === 'student').length;
    return { total: members.length, teachers, students };
  }, [members]);

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) return;
    try {
      const res = await adminApi.assignTeacher(id, selectedTeacherId);
      if (res?.success) { setSelectedTeacherId(''); fetchClassData(); }
    } catch (error) {
      alert(error?.response?.data?.message || 'Gán giáo viên thất bại');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) return;
    try {
      const res = await adminApi.enrollStudent(id, selectedStudentId);
      if (res?.success) { setSelectedStudentId(''); fetchClassData(); }
    } catch (error) {
      alert(error?.response?.data?.message || 'Đăng ký học sinh thất bại');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Xóa thành viên này khỏi lớp?')) return;
    try {
      const res = await adminApi.removeClassMember(id, memberId);
      if (res?.success) fetchClassData();
    } catch (error) {
      alert(error?.response?.data?.message || 'Xóa thành viên thất bại');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!generateForm.templateId) { alert('Vui lòng chọn mẫu lịch học.'); return; }
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await adminApi.generateSessions({ classId: id, templateId: generateForm.templateId });
      if (res?.success) {
        setGenerateResult({ count: res.data?.length ?? 0 });
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Phát sinh lịch học thất bại.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="class-detail-page">
      <section className="class-detail-header">
        <button type="button" className="back-btn" onClick={() => navigate('/admin/classes')}>← Quay lại</button>
        <div className="header-main">
          <h1>{classData?.name || 'Chi tiết lớp học'}</h1>
          <p>{classData?.code || '-'} • {classData?.level || '-'} • {classData?.status || '-'}</p>
        </div>
      </section>

      <section className="class-detail-actions">
        <button className="btn-secondary" type="button" onClick={() => navigate(`/admin/classes/${id}/rooms`)}>
          🏫 Gán phòng lịch học
        </button>
        <button className="btn-primary" onClick={() => { setGenerateForm({ templateId: '' }); setGenerateResult(null); setGenerateOpen(true); }}>
          📅 Phát sinh Lịch học
        </button>
      </section>

      <section className="class-detail-stats">
        <article><h3>{stats.total}</h3><p>Tổng thành viên</p></article>
        <article><h3>{stats.teachers}</h3><p>Giáo viên</p></article>
        <article><h3>{stats.students}</h3><p>Học sinh</p></article>
      </section>

      <section className="class-detail-tools">
        <div className="tool-card">
          <h3>Gán Giáo viên</h3>
          <div className="tool-row">
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}>
              <option value="">Chọn giáo viên</option>
              {teacherOptions.map(t => (
                <option key={t._id} value={t._id}>
                  {t.firstName} {t.lastName} ({t.email}){t.phone ? ` - ${t.phone}` : ''}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAssignTeacher}>Gán</button>
          </div>
        </div>

        <div className="tool-card">
          <h3>Đăng ký Học sinh</h3>
          <div className="tool-row">
            <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
              <option value="">Chọn học sinh</option>
              {studentOptions.map(s => (
                <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>
              ))}
            </select>
            <button type="button" onClick={handleEnrollStudent}>Đăng ký</button>
          </div>
        </div>
      </section>

      <section className="class-members-panel">
        <div className="panel-head">
          <h2>Thành viên lớp</h2>
          <select value={memberRoleFilter} onChange={e => setMemberRoleFilter(e.target.value)}>
            <option value="">Tất cả vai trò</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Họ tên</th><th>Email</th><th>SĐT</th><th className="center-cell">Vai trò</th><th className="center-cell">Trạng thái</th><th>Ngày tham gia</th><th className="center-cell">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {!loading && members.length === 0 && (
                <tr><td colSpan="7" className="empty-row">Chưa có thành viên nào.</td></tr>
              )}
              {members.map(member => (
                <tr key={member._id}>
                  <td>{member.user?.firstName} {member.user?.lastName}</td>
                  <td>{member.user?.email || '-'}</td>
                  <td>{member.user?.phone || member.user?.phoneNumber || '-'}</td>
                  <td className="center-cell"><span className={`role-pill ${member.role}`}>{member.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}</span></td>
                  <td className="center-cell"><span className={`status-pill ${member.status}`}>{member.status}</span></td>
                  <td>{member.enrolledAt ? new Date(member.enrolledAt).toLocaleDateString('vi-VN') : '-'}</td>
                  <td className="center-cell">
                    <button type="button" className="icon-btn delete" title="Xóa" aria-label="Xóa thành viên" onClick={() => handleRemoveMember(member._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="class-timetable-panel">
         <div className="panel-head">
            <h2>Lịch học của Lớp</h2>
         </div>
         <div style={{ marginTop: '20px' }}>
            <Timetable role="admin" fixedClassId={id} />
         </div>
      </section>

      {/* Generate TKB Modal */}
      {generateOpen && (
        <div className="modal-overlay" onClick={() => setGenerateOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>📅 Phát sinh Thời khóa biểu</h2>
            <p className="modal-subtitle">Tự động tạo các buổi học cho lớp <strong>{classData?.name}</strong> dựa trên mẫu lịch học.</p>
            {generateResult ? (
              <div className="generate-success">
                <p>✅ Đã phát sinh thành công <strong>{generateResult.count}</strong> buổi học!</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setGenerateOpen(false)}>Đóng</button>
                  <button className="btn-primary" onClick={() => { setGenerateResult(null); }}>Phát sinh thêm</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="modal-form">
                <label>Mẫu lịch học</label>
                <select value={generateForm.templateId} onChange={e => setGenerateForm(p => ({ ...p, templateId: e.target.value }))} required>
                  <option value="">-- Chọn mẫu lịch --</option>
                  {templates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                <p className="hint-text">
                  Hệ thống sẽ tự động tạo các buổi học từ ngày <strong>{classData?.startDate ? new Date(classData.startDate).toLocaleDateString('vi-VN') : '?'}</strong> đến <strong>{classData?.endDate ? new Date(classData.endDate).toLocaleDateString('vi-VN') : '?'}</strong> dựa trên mẫu lịch đã chọn. Các buổi đã tồn tại sẽ được bỏ qua.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setGenerateOpen(false)}>Hủy</button>
                  <button type="submit" className="btn-primary" disabled={generating}>{generating ? 'Đang phát sinh...' : 'Phát sinh'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetail;
