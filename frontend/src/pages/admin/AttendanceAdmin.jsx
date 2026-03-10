import React, { useEffect, useMemo, useState } from 'react';
import adminApi from '../../api/adminApi';
import './AttendanceAdmin.css';

const statusOptions = ['present', 'absent', 'late', 'excused'];

const AttendanceAdmin = () => {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ classId: '', status: '', page: 1, limit: 50 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(false);

  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailRows, setDetailRows] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState('');

  const fetchAttendances = async (params = filters) => {
    setLoading(true);
    try {
      const res = await adminApi.getAttendances(params);
      if (res?.success && res?.data) {
        setRecords(res.data.records || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 50 });
      }
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => fetchAttendances(filters), 250);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const groupedSessions = useMemo(() => {
    const map = new Map();

    records.forEach((item) => {
      const sessionId = item.session?._id;
      if (!sessionId) return;

      if (!map.has(sessionId)) {
        map.set(sessionId, {
          sessionId,
          title: item.session?.title || '-',
          date: item.session?.date || null,
          startTime: item.session?.startTime || '-',
          markedBy: item.markedBy ? `${item.markedBy.firstName || ''} ${item.markedBy.lastName || ''}`.trim() : '-',
          total: 0,
        });
      }

      map.get(sessionId).total += 1;
    });

    return Array.from(map.values());
  }, [records]);

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const openSessionDetail = async (session) => {
    setSessionDetail(session);
    setDetailLoading(true);
    try {
      const [sessionRes, listRes] = await Promise.all([
        adminApi.getSessionAttendance(session.sessionId),
        adminApi.getAttendances({ sessionId: session.sessionId, page: 1, limit: 200 }),
      ]);

      const attendanceMap = new Map((listRes?.data?.records || []).map((r) => [r.student?._id, r]));
      const rows = (sessionRes?.data || []).map((row) => ({
        ...row,
        attendanceId: attendanceMap.get(row.student?._id)?._id || null,
      }));

      setDetailRows(rows);
    } catch (error) {
      console.error('Failed to get session attendance detail:', error);
      alert(error?.response?.data?.message || 'Cannot load session detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleInlineStatusChange = async (studentId, nextStatus) => {
    const target = detailRows.find((r) => r.student?._id === studentId);
    const prevStatus = target?.status;

    setDetailRows((prev) => prev.map((r) => (r.student?._id === studentId ? { ...r, status: nextStatus } : r)));

    if (!target?.attendanceId) {
      alert('Chưa có record điểm danh cho học sinh này nên chưa cập nhật trực tiếp được.');
      setDetailRows((prev) => prev.map((r) => (r.student?._id === studentId ? { ...r, status: prevStatus } : r)));
      return;
    }

    setSavingStudentId(studentId);
    try {
      await adminApi.updateAttendance(target.attendanceId, { status: nextStatus });
      fetchAttendances(filters);
    } catch (error) {
      setDetailRows((prev) => prev.map((r) => (r.student?._id === studentId ? { ...r, status: prevStatus } : r)));
      alert(error?.response?.data?.message || 'Update attendance failed');
    } finally {
      setSavingStudentId('');
    }
  };

  return (
    <div className="admin-attendance-page">
      <section className="admin-attendance-header">
        <div>
          <h1>Attendance Management</h1>
          <p>Click a session row to open student statuses and edit inline.</p>
        </div>
      </section>

      <section className="admin-attendance-panel">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Filter by classId"
            value={filters.classId}
            onChange={(e) => setFilters((prev) => ({ ...prev, classId: e.target.value, page: 1 }))}
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="">All status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Date</th>
                <th>Time</th>
                <th>Teacher</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              {!loading && groupedSessions.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-row">No attendance records found.</td>
                </tr>
              )}

              {groupedSessions.map((session) => (
                <tr key={session.sessionId} className="click-row" onClick={() => openSessionDetail(session)}>
                  <td>{session.title}</td>
                  <td>{session.date ? new Date(session.date).toLocaleDateString() : '-'}</td>
                  <td>{session.startTime || '-'}</td>
                  <td>{session.markedBy || '-'}</td>
                  <td>{session.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>Total: {pagination.total}</span>
          <div className="pagination-actions">
            <button type="button" disabled={pagination.page <= 1} onClick={() => handlePageChange(pagination.page - 1)}>Prev</button>
            <span>{pagination.page} / {pagination.pages || 1}</span>
            <button type="button" disabled={pagination.page >= (pagination.pages || 1)} onClick={() => handlePageChange(pagination.page + 1)}>Next</button>
          </div>
        </div>
      </section>

      {sessionDetail && (
        <div className="modal-overlay" role="presentation" onClick={() => setSessionDetail(null)}>
          <div className="modal-card wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{sessionDetail.title} — Student Attendance</h2>
            <p className="modal-subtitle">{sessionDetail.date ? new Date(sessionDetail.date).toLocaleDateString() : '-'}</p>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!detailLoading && detailRows.length === 0 && (
                    <tr>
                      <td colSpan="3" className="empty-row">No student attendance data.</td>
                    </tr>
                  )}

                  {detailRows.map((row, idx) => (
                    <tr key={`${row.student?._id || idx}-${idx}`}>
                      <td>{row.student?.firstName} {row.student?.lastName}</td>
                      <td>{row.student?.email || '-'}</td>
                      <td>
                        <select
                          className="inline-status-select"
                          value={row.status || 'absent'}
                          disabled={savingStudentId === row.student?._id}
                          onChange={(e) => handleInlineStatusChange(row.student?._id, e.target.value)}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setSessionDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceAdmin;
