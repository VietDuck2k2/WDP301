import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios';
import './Dashboard.css';

const defaultStats = {
  users: { total: 0, teachers: 0, students: 0 },
  classes: { total: 0, active: 0 },
  sessions: { today: 0 },
  attendance: { weekTotal: 0, weekPresent: 0, weekAttendanceRate: 0 },
  recentSessions: [],
};

const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  const statCards = useMemo(
    () => [
      { label: 'Total Users', value: stats.users.total, helper: `${stats.users.teachers} teachers • ${stats.users.students} students` },
      { label: 'Active Classes', value: stats.classes.active, helper: `${stats.classes.total} total classes` },
      { label: 'Sessions Today', value: stats.sessions.today, helper: 'Across all classes' },
      { label: 'Weekly Attendance', value: `${stats.attendance.weekAttendanceRate}%`, helper: `${stats.attendance.weekPresent}/${stats.attendance.weekTotal} present` },
    ],
    [stats]
  );

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/admin/dashboard/stats');
        if (res?.success && res?.data) {
          setStats({ ...defaultStats, ...res.data });
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard-page">
      <section className="admin-dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Admin overview and recent session activities</p>
        </div>
        <button type="button" onClick={() => window.location.reload()}>
          Refresh List
        </button>
      </section>

      <section className="admin-stats-grid">
        {statCards.map((card) => (
          <article className="admin-stat-card" key={card.label}>
            <p className="label">{card.label}</p>
            <h3>{loading ? '...' : card.value}</h3>
            <p className="helper">{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="admin-table-panel">
        <div className="admin-table-head">
          <h2>Recent Sessions</h2>
          <span>{stats.recentSessions.length} items</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Session Title</th>
                <th>Class</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {!loading && stats.recentSessions.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-row">No recent sessions found.</td>
                </tr>
              )}

              {stats.recentSessions.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.class?.name || '-'}</td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.startTime} - {item.endTime}</td>
                  <td>
                    <span className={`status-pill ${item.status}`}>{item.status}</span>
                  </td>
                  <td>{item.room || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
