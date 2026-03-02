import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../api/adminApi';
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

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const [classRes, memberRes, teacherRes, studentRes] = await Promise.all([
        adminApi.getClassById(id),
        adminApi.getClassMembers(id, memberRoleFilter),
        adminApi.getUsersByRole('teacher'),
        adminApi.getUsersByRole('student'),
      ]);

      if (classRes?.success) setClassData(classRes.data);
      if (memberRes?.success) setMembers(memberRes.data || []);
      if (teacherRes?.success) setTeacherOptions(teacherRes.data || []);
      if (studentRes?.success) setStudentOptions(studentRes.data || []);
    } catch (error) {
      console.error('Failed to fetch class detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, memberRoleFilter]);

  const stats = useMemo(() => {
    const teachers = members.filter((m) => m.role === 'teacher').length;
    const students = members.filter((m) => m.role === 'student').length;
    return { total: members.length, teachers, students };
  }, [members]);

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) return;
    try {
      const res = await adminApi.assignTeacher(id, selectedTeacherId);
      if (res?.success) {
        setSelectedTeacherId('');
        fetchClassData();
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Assign teacher failed');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) return;
    try {
      const res = await adminApi.enrollStudent(id, selectedStudentId);
      if (res?.success) {
        setSelectedStudentId('');
        fetchClassData();
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Enroll student failed');
    }
  };

  const handleRemoveMember = async (memberId) => {
    const confirmed = window.confirm('Remove this member from class?');
    if (!confirmed) return;

    try {
      const res = await adminApi.removeClassMember(id, memberId);
      if (res?.success) fetchClassData();
    } catch (error) {
      alert(error?.response?.data?.message || 'Remove member failed');
    }
  };

  return (
    <div className="class-detail-page">
      <section className="class-detail-header">
        <button type="button" className="back-btn" onClick={() => navigate('/admin/classes')}>← Back</button>
        <div>
          <h1>{classData?.name || 'Class Detail'}</h1>
          <p>{classData?.code || '-'} • {classData?.level || '-'} • {classData?.status || '-'}</p>
        </div>
      </section>

      <section className="class-detail-stats">
        <article><h3>{stats.total}</h3><p>Total Members</p></article>
        <article><h3>{stats.teachers}</h3><p>Teachers</p></article>
        <article><h3>{stats.students}</h3><p>Students</p></article>
      </section>

      <section className="class-detail-tools">
        <div className="tool-card">
          <h3>Assign Teacher</h3>
          <div className="tool-row">
            <select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
              <option value="">Select teacher</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.firstName} {teacher.lastName} ({teacher.email})
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAssignTeacher}>Assign</button>
          </div>
        </div>

        <div className="tool-card">
          <h3>Enroll Student</h3>
          <div className="tool-row">
            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="">Select student</option>
              {studentOptions.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName} ({student.email})
                </option>
              ))}
            </select>
            <button type="button" onClick={handleEnrollStudent}>Enroll</button>
          </div>
        </div>
      </section>

      <section className="class-members-panel">
        <div className="panel-head">
          <h2>Members</h2>
          <select value={memberRoleFilter} onChange={(e) => setMemberRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Enrolled At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-row">No members found.</td>
                </tr>
              )}

              {members.map((member) => (
                <tr key={member._id}>
                  <td>{member.user?.firstName} {member.user?.lastName}</td>
                  <td>{member.user?.email || '-'}</td>
                  <td><span className={`role-pill ${member.role}`}>{member.role}</span></td>
                  <td><span className={`status-pill ${member.status}`}>{member.status}</span></td>
                  <td>{member.enrolledAt ? new Date(member.enrolledAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn delete"
                      title="Remove"
                      aria-label="Remove member"
                      onClick={() => handleRemoveMember(member._id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ClassDetail;
