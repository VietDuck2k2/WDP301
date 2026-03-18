import React, { useEffect, useState } from 'react';
import adminApi from '../../api/adminApi';
import './Reports.css';

const periodOptions = ['week', 'month'];

const Reports = () => {
  const [overview, setOverview] = useState(null);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceMeta, setAttendanceMeta] = useState({ totalSessions: 0, totalRecords: 0 });
  const [period, setPeriod] = useState('month');
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await adminApi.getReportOverview();
      if (res?.success) {
        setOverview(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch report overview:', error);
    }
  };

  const fetchAttendanceReport = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (classId.trim()) params.classId = classId.trim();

      const res = await adminApi.getAttendanceReport(params);
      if (res?.success && res?.data) {
        setAttendanceRows(res.data.classReports || []);
        setAttendanceMeta({
          totalSessions: res.data.totalSessions || 0,
          totalRecords: res.data.totalRecords || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch attendance report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchAttendanceReport();
    }, 250);

    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, classId]);

  return (
    <div className="admin-reports-page">
      <section className="admin-reports-header">
        <div>
          <h1>Reports</h1>
          <p>System overview and attendance analytics</p>
        </div>
      </section>

      <section className="overview-grid">
        <article>
          <h3>{overview?.classes?.total ?? 0}</h3>
          <p>Total Classes</p>
          <small>Active: {overview?.classes?.active ?? 0}</small>
        </article>
        <article>
          <h3>{overview?.sessions?.total ?? 0}</h3>
          <p>Total Sessions</p>
          <small>Completed: {overview?.sessions?.completed ?? 0}</small>
        </article>
        <article>
          <h3>{overview?.assignments?.totalSubmissions ?? 0}</h3>
          <p>Total Submissions</p>
          <small>Graded: {overview?.assignments?.gradedSubmissions ?? 0}</small>
        </article>
        <article>
          <h3>{overview?.attendance?.overallRate ?? 0}%</h3>
          <p>Overall Attendance</p>
          <small>Present: {overview?.attendance?.presentCount ?? 0}</small>
        </article>
      </section>

      <section className="attendance-report-panel">
        <div className="panel-head">
          <h2>Attendance Report</h2>
          <div className="report-filters">
            <input
              type="text"
              placeholder="Optional classId"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            />
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              {periodOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="meta-row">
          <span>Sessions: {attendanceMeta.totalSessions}</span>
          <span>Records: {attendanceMeta.totalRecords}</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Sessions</th>
                <th>Total</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Excused</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {!loading && attendanceRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-row">No attendance report data.</td>
                </tr>
              )}

              {attendanceRows.map((row, idx) => (
                <tr key={`${row.class?._id || idx}-${idx}`}>
                  <td>
                    <div className="class-name">{row.class?.name || '-'}</div>
                    <div className="class-code">{row.class?.code || '-'}</div>
                  </td>
                  <td>{row.sessions}</td>
                  <td>{row.total}</td>
                  <td>{row.present}</td>
                  <td>{row.absent}</td>
                  <td>{row.late}</td>
                  <td>{row.excused}</td>
                  <td>{row.attendanceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Reports;
