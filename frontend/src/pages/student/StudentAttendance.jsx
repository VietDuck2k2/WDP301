import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import '../../pages/PageCommon.css';

const STATUS_LABEL = { present: 'Có mặt', absent: 'Vắng', late: 'Muộn', excused: 'Có phép' };

export default function StudentAttendance() {
   const [summary, setSummary] = useState(null);
   const [history, setHistory] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      Promise.all([
         studentApi.getMyAttendanceSummary(),
         studentApi.getMyAttendances(),
      ])
         .then(([sRes, hRes]) => {
            if (sRes?.success && sRes.data) setSummary(sRes.data);
            if (hRes?.success && hRes.data) setHistory(Array.isArray(hRes.data) ? hRes.data : []);
         })
         .catch(() => {
            setSummary(null);
            setHistory([]);
         })
         .finally(() => setLoading(false));
   }, []);

   const formatDate = (d) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Điểm danh</h1>
         {loading && <p className="page-common-loading">Đang tải...</p>}
         {!loading && summary && (
            <div className="page-common-card" style={{ marginBottom: 24 }}>
               <h2 style={{ marginTop: 0 }}>Tổng hợp</h2>
               <p>Có mặt: {summary.present ?? 0} | Vắng: {summary.absent ?? 0} | Muộn: {summary.late ?? 0} | Có phép: {summary.excused ?? 0}</p>
               <p><strong>Tỷ lệ điểm danh: {summary.attendanceRate ?? '-'}%</strong></p>
            </div>
         )}
         {!loading && (
            <>
               <h2>Lịch sử</h2>
               {history.length === 0 && <p className="page-common-empty">Chưa có bản ghi.</p>}
               {history.length > 0 && (
                  <div className="page-common-card">
                     <table className="page-common-table">
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
                                 <td>{a.session?.title || '-'}</td>
                                 <td>{formatDate(a.session?.date)}</td>
                                 <td>{STATUS_LABEL[a.status] || a.status}</td>
                                 <td>{a.notes || '-'}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </>
         )}
      </div>
   );
}
