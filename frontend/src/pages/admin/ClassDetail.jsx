import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { timetableApi } from '../../api/timetableApi';
import Timetable from '../Timetable';
import MultiSelectUserDropdown from '../../components/MultiSelectUserDropdown';
import './ClassDetail.css';
import './SessionRooms.css';

const toSessionDateLabel = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN');
};

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [memberRoleFilter, setMemberRoleFilter] = useState('');
  const members = useMemo(() => {
    if (!memberRoleFilter) return allMembers;
    return allMembers.filter((m) => m.role === memberRoleFilter);
  }, [allMembers, memberRoleFilter]);
  const [loading, setLoading] = useState(false);

  const [teacherOptions, setTeacherOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Generate TKB state
  const [templates, setTemplates] = useState([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({ templateId: '' });
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const [timetableRefreshKey, setTimetableRefreshKey] = useState(0);
  const [bulkTeacherModalOpen, setBulkTeacherModalOpen] = useState(false);
  const [bulkSessions, setBulkSessions] = useState([]);
  const [bulkSessionsLoading, setBulkSessionsLoading] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState(() => new Set());
  const [bulkAssignTeacherId, setBulkAssignTeacherId] = useState('');
  const [bulkRowSaving, setBulkRowSaving] = useState({});

  const teachersInClass = useMemo(() => {
    return allMembers
      .filter((m) => m.role === 'teacher' && m.user?._id)
      .map((m) => m.user);
  }, [allMembers]);

  const fetchClassData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, memberRes, teacherRes, studentRes, tplRes] = await Promise.all([
        adminApi.getClassById(id),
        adminApi.getClassMembers(id, ''), // always fetch ALL active members for correct dropdown filtering
        adminApi.getUsersByRole('teacher'),
        adminApi.getUsersByRole('student'),
        adminApi.getScheduleTemplates(),
      ]);
      if (classRes?.success) setClassData(classRes.data);
      if (memberRes?.success) setAllMembers(memberRes.data || []);
      if (teacherRes?.success) setTeacherOptions(teacherRes.data || []);
      if (studentRes?.success) setStudentOptions(studentRes.data || []);
      if (tplRes?.success) setTemplates(tplRes.data || []);
    } catch (error) {
      console.error('Failed to fetch class detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchClassData(); }, [fetchClassData]);

  const stats = useMemo(() => {
    const teachers = allMembers.filter(m => m.role === 'teacher').length;
    const students = allMembers.filter(m => m.role === 'student').length;
    return { total: allMembers.length, teachers, students };
  }, [allMembers]);

  const assignedTeacherIds = useMemo(() => {
    const set = new Set();
    allMembers.forEach((m) => {
      if (m.role === 'teacher' && m.user?._id) set.add(String(m.user._id));
    });
    return set;
  }, [allMembers]);

  const enrolledStudentIds = useMemo(() => {
    const set = new Set();
    allMembers.forEach((m) => {
      if (m.role === 'student' && m.user?._id) set.add(String(m.user._id));
    });
    return set;
  }, [allMembers]);

  const filteredTeacherOptions = useMemo(() => {
    // hide teachers already assigned to this class
    return (teacherOptions || []).filter((t) => !assignedTeacherIds.has(String(t._id)));
  }, [teacherOptions, assignedTeacherIds]);

  const filteredStudentOptions = useMemo(() => {
    // hide students already enrolled in this class
    return (studentOptions || []).filter((s) => !enrolledStudentIds.has(String(s._id)));
  }, [studentOptions, enrolledStudentIds]);

  const handleAssignTeacher = async () => {
    if (!selectedTeacherIds.length) return;
    try {
      const res = await adminApi.assignTeacher(id, selectedTeacherIds);
      if (res?.success) {
        setSelectedTeacherIds([]);
        fetchClassData();
      }
    } catch (error) {
      alert(error?.response?.data?.message || 'Gán giáo viên thất bại');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentIds.length) return;
    try {
      const results = await Promise.allSettled(
        selectedStudentIds.map((studentId) => adminApi.enrollStudent(id, studentId))
      );
      const failed = results
        .map((r, i) => ({ r, id: selectedStudentIds[i] }))
        .filter(({ r }) => r.status === 'rejected');
      if (failed.length > 0) {
        const msgs = failed.map(({ r }) => r.reason?.response?.data?.message || r.reason?.message || 'Lỗi');
        alert(
          `Đăng ký thất bại ${failed.length}/${selectedStudentIds.length} học sinh.\n${Array.from(new Set(msgs)).slice(0, 5).join('\n')}`
        );
      }
      setSelectedStudentIds([]);
      await fetchClassData();
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

  const loadBulkSessions = useCallback(async () => {
    if (!id) return;
    setBulkSessionsLoading(true);
    try {
      const res = await timetableApi.getSessions({ classId: id, limit: 500, page: 1 });
      if (res?.success) {
        const list = res.data?.sessions || [];
        list.sort((a, b) => new Date(a.date) - new Date(b.date) || (a.sessionNumber || 0) - (b.sessionNumber || 0));
        setBulkSessions(list);
        setBulkSelectedIds(new Set());
        setBulkAssignTeacherId('');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Không tải được danh sách buổi học.');
    } finally {
      setBulkSessionsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (bulkTeacherModalOpen && id) loadBulkSessions();
  }, [bulkTeacherModalOpen, id, loadBulkSessions]);

  const toggleBulkSelected = (sessionId) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const toggleBulkAll = (checked) => {
    if (!checked) setBulkSelectedIds(new Set());
    else setBulkSelectedIds(new Set(bulkSessions.map((s) => s._id)));
  };

  const saveTeacherForSessions = async () => {
    const ids = Array.from(bulkSelectedIds).filter(Boolean);
    if (ids.length === 0) return alert('Hãy chọn ít nhất một buổi học.');
    if (!bulkAssignTeacherId) return alert('Vui lòng chọn giáo viên trước khi lưu.');

    setBulkRowSaving((p) => {
      const next = { ...p };
      ids.forEach((sid) => {
        next[sid] = true;
      });
      return next;
    });

    try {
      const results = await Promise.allSettled(
        ids.map((sid) => timetableApi.updateSession(sid, { teacher: bulkAssignTeacherId }))
      );
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        const messages = failed.map((item) => {
          const err = item.reason;
          return err?.response?.data?.message || err?.message || 'Gán giáo viên thất bại';
        });
        const unique = Array.from(new Set(messages));
        alert(
          `Có ${failed.length}/${ids.length} buổi lưu thất bại.\n${unique.slice(0, 5).join('\n')}` +
            (unique.length > 5 ? `\n...` : '')
        );
      }
      await loadBulkSessions();
      setTimetableRefreshKey((k) => k + 1);
    } catch (e) {
      alert(e?.response?.data?.message || 'Gán giáo viên thất bại.');
    } finally {
      setBulkRowSaving((p) => {
        const next = { ...p };
        ids.forEach((sid) => {
          next[sid] = false;
        });
        return next;
      });
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
        <div className="tool-card tool-card--picker">
          <h3>Gán Giáo viên</h3>
          <div className="tool-row">
            <MultiSelectUserDropdown
              options={filteredTeacherOptions}
              selectedIds={selectedTeacherIds}
              onSelectionChange={setSelectedTeacherIds}
              placeholder="Chọn giáo viên..."
              emptyLabel="Không còn giáo viên khả dụng hoặc không khớp bộ lọc"
            />
            <button
              type="button"
              className="tool-action-btn"
              disabled={selectedTeacherIds.length === 0}
              onClick={handleAssignTeacher}
            >
              Gán{selectedTeacherIds.length > 0 ? ` ${selectedTeacherIds.length} GV` : ''}
            </button>
          </div>
        </div>

        <div className="tool-card tool-card--picker">
          <h3>Đăng ký Học sinh</h3>
          <div className="tool-row">
            <MultiSelectUserDropdown
              options={filteredStudentOptions}
              selectedIds={selectedStudentIds}
              onSelectionChange={setSelectedStudentIds}
              placeholder="Chọn học sinh..."
              emptyLabel="Không còn học sinh khả dụng hoặc không khớp bộ lọc"
            />
            <button
              type="button"
              className="tool-action-btn"
              disabled={selectedStudentIds.length === 0}
              onClick={handleEnrollStudent}
            >
              Đăng ký{selectedStudentIds.length > 0 ? ` ${selectedStudentIds.length} HS` : ''}
            </button>
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
            <Timetable
              role="admin"
              fixedClassId={id}
              refreshKey={timetableRefreshKey}
              onBulkAssignTeacherClick={() => setBulkTeacherModalOpen(true)}
            />
         </div>
      </section>

      {/* Generate TKB Modal */}
      {bulkTeacherModalOpen && (
        <div className="modal-overlay" role="presentation" onClick={() => setBulkTeacherModalOpen(false)}>
          <div className="modal-card assign-teacher-bulk-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Gán giáo viên buổi dạy</h2>
            <p className="modal-subtitle">
              Chọn các buổi học, sau đó chọn một giáo viên đã được gán cho lớp <strong>{classData?.name || ''}</strong> và bấm Lưu — tương tự giao diện gán phòng.
            </p>

            {teachersInClass.length === 0 ? (
              <p className="hint-text">Chưa có giáo viên nào trong lớp. Hãy gán giáo viên ở phần &quot;Gán Giáo viên&quot; phía trên trước.</p>
            ) : null}

            <section className="session-rooms-table" style={{ marginTop: 12 }}>
              {bulkSessionsLoading ? (
                <div className="empty-box">Đang tải danh sách buổi học...</div>
              ) : bulkSessions.length === 0 ? (
                <div className="empty-box">Chưa có buổi học nào (hãy phát sinh lịch hoặc tạo buổi trước).</div>
              ) : (
                <>
                  <div className="assign-bar">
                    <label htmlFor="bulk-teacher-select">Chọn giáo viên</label>
                    <select
                      id="bulk-teacher-select"
                      value={bulkAssignTeacherId}
                      onChange={(e) => setBulkAssignTeacherId(e.target.value)}
                      disabled={teachersInClass.length === 0}
                    >
                      <option value="">-- Chọn giáo viên --</option>
                      {teachersInClass.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.firstName} {t.lastName} ({t.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={bulkSelectedIds.size === 0 || teachersInClass.length === 0}
                      onClick={saveTeacherForSessions}
                    >
                      Lưu ({bulkSelectedIds.size})
                    </button>
                    {bulkSelectedIds.size === 0 && (
                      <span className="assign-hint">Hãy tick các buổi cần gán giáo viên</span>
                    )}
                  </div>

                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>
                            <input
                              type="checkbox"
                              checked={bulkSelectedIds.size > 0 && bulkSelectedIds.size === bulkSessions.length}
                              onChange={(e) => toggleBulkAll(e.target.checked)}
                              aria-label="Chọn tất cả"
                            />
                          </th>
                          <th>Buổi</th>
                          <th>Ngày</th>
                          <th>Slot</th>
                          <th>Giờ</th>
                          <th>Giáo viên hiện tại</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkSessions.map((s) => (
                          <tr key={s._id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={bulkSelectedIds.has(s._id)}
                                onChange={() => toggleBulkSelected(s._id)}
                                disabled={!!bulkRowSaving[s._id]}
                                aria-label={`Chọn buổi ${s.sessionNumber}`}
                              />
                            </td>
                            <td>{s.title || `Buổi ${s.sessionNumber}`}</td>
                            <td>{toSessionDateLabel(s.date)}</td>
                            <td>{s.slotNumber ?? '-'}</td>
                            <td>{s.startTime ? `${s.startTime}–${s.endTime}` : '-'}</td>
                            <td>
                              {s.teacher ? (
                                `${s.teacher.firstName || ''} ${s.teacher.lastName || ''}`.trim() || '—'
                              ) : (
                                <span className="muted">Chưa gán</span>
                              )}
                            </td>
                            <td>{s.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="btn-secondary" onClick={() => setBulkTeacherModalOpen(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
