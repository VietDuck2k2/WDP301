import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');
const STATUS_LABEL = { present: 'Có mặt', absent: 'Vắng', late: 'Muộn', excused: 'Có phép' };

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    studentApi.getClasses().then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    studentApi.getMyAttendanceSummary().then((res) => { if (res?.success && res.data) setSummary(res.data); }).catch(() => setSummary(null)).finally(() => setLoading(false));
    studentApi.getMyAttendances().then((res) => { if (res?.success && res.data) setHistory(Array.isArray(res.data) ? res.data : []); });
  }, []);

  const [classSummary, setClassSummary] = useState(null);
  useEffect(() => {
    if (!classId) { setClassSummary(null); return; }
    studentApi.getMyAttendanceByClass(classId).then((res) => { if (res?.success && res.data) setClassSummary(res.data); });
  }, [classId]);

  const displaySummary = classId && classSummary ? classSummary : summary;

  return (
    <div className="page-card">
      <h1 className="page-title">Điểm danh</h1>
      <div className="toolbar">
        <button type="button" className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>Tổng hợp</button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Lịch sử</button>
        {tab === 'summary' && (
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="form-select">
            <option value="">Tất cả</option>
            {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </div>
      {loading && tab === 'summary' ? <p>Đang tải...</p> : tab === 'summary' && displaySummary ? (
        <div className="summary-card">
          <p>Tổng: {displaySummary.total} · Có mặt: {displaySummary.present} · Vắng: {displaySummary.absent} · Muộn: {displaySummary.late}</p>
          <p><strong>Tỷ lệ: {displaySummary.attendanceRate ?? '-'}%</strong></p>
        </div>
      ) : tab === 'history' ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Buổi học</th><th>Ngày</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead>
            <tbody>
              {history.map((a) => (
                <tr key={a._id}>
                  <td>{a.session?.title}</td>
                  <td>{formatDate(a.session?.date)}</td>
                  <td>{STATUS_LABEL[a.status] || a.status}</td>
                  <td>{a.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.length === 0 && <p className="empty">Chưa có lịch sử điểm danh.</p>}
        </div>
      ) : tab === 'summary' && !displaySummary ? <p className="empty">Chưa có dữ liệu.</p> : null}
    </div>
  );
}
