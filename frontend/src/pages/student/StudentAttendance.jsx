import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');
const STATUS_LABEL = { 
  present: 'Có mặt', 
  absent: 'Vắng', 
  late: 'Muộn', 
  excused: 'Có phép' 
};

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('summary');

  // Load class list for dropdown
  useEffect(() => {
    studentApi.getClasses().then((res) => { 
      if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); 
    });
  }, []);

  // Sync data when classId or Tab changes
  useEffect(() => {
    setLoading(true);
    
    // Summary logic
    const fetchSummary = classId 
      ? studentApi.getMyAttendanceByClass(classId) 
      : studentApi.getMyAttendanceSummary();
    
    // History logic: filter by classId if selected
    const historyParams = classId ? { classId } : {};
    const fetchHistory = studentApi.getMyAttendances(historyParams);

    Promise.all([fetchSummary, fetchHistory])
      .then(([summaryRes, historyRes]) => {
        if (summaryRes?.success) setSummary(summaryRes.data);
        else setSummary(null);

        if (historyRes?.success && historyRes.data) {
          setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        } else {
          setHistory([]);
        }
      })
      .catch(err => {
        console.error('Error fetching attendance data:', err);
        setSummary(null);
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <div className="page-card">
      <h1 className="page-title">Điểm danh của tôi</h1>
      
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="tab-group" style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            className={tab === 'summary' ? 'active' : ''} 
            onClick={() => setTab('summary')}
          >
            Tổng hợp
          </button>
          <button 
            type="button" 
            className={tab === 'history' ? 'active' : ''} 
            onClick={() => setTab('history')}
          >
            Lịch sử
          </button>
        </div>

        <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span className="muted" style={{ fontSize: '0.9rem' }}>Lọc theo lớp:</span>
           <select 
             value={classId} 
             onChange={(e) => setClassId(e.target.value)} 
             className="form-select"
             style={{ minWidth: '180px' }}
           >
             <option value="">Tất cả lớp học</option>
             {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
           </select>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
         {loading ? (
            <p>Đang tải dữ liệu...</p>
         ) : tab === 'summary' ? (
            summary ? (
               <div className="summary-card" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                     <div>
                        <span className="muted" style={{ fontSize: '0.85rem' }}>Tổng số buổi</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '4px 0' }}>{summary.total || 0}</p>
                     </div>
                     <div>
                        <span className="muted" style={{ fontSize: '0.85rem' }}>Có mặt</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '4px 0', color: '#10b981' }}>{summary.present || 0}</p>
                     </div>
                     <div>
                        <span className="muted" style={{ fontSize: '0.85rem' }}>Vắng mặt</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '4px 0', color: '#ef4444' }}>{summary.absent || 0}</p>
                     </div>
                     <div>
                        <span className="muted" style={{ fontSize: '0.85rem' }}>Tỷ lệ chuyên cần</span>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '4px 0', color: '#3b82f6' }}>{summary.attendanceRate ?? '-'}%</p>
                     </div>
                  </div>
               </div>
            ) : (
               <p className="empty">Không có dữ liệu tổng hợp cho lớp này.</p>
            )
         ) : (
            <div className="table-wrap">
               <table className="data-table">
                  <thead>
                     <tr>
                        <th>Buổi học</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                        <th>Ghi chú</th>
                     </tr>
                  </thead>
                  <tbody>
                     {history.map((a) => (
                        <tr key={a._id}>
                        <td>{a.session?.title}</td>
                        <td>{formatDate(a.session?.date)}</td>
                        <td>
                           <span className={`status-badge ${a.status}`}>
                              {STATUS_LABEL[a.status] || a.status}
                           </span>
                        </td>
                        <td>{a.notes || '-'}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {history.length === 0 && <p className="empty" style={{ textAlign: 'center', padding: '40px' }}>Chưa có lịch sử điểm danh.</p>}
            </div>
         )}
      </div>
    </div>
  );
}
