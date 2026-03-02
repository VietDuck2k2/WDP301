import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import '../../pages/PageCommon.css';

export default function StudentGrades() {
   const [data, setData] = useState({ grades: [], summary: null });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      studentApi
         .getMyGrades()
         .then((res) => {
            if (res?.success && res.data) {
               const d = res.data;
               setData({
                  grades: d.grades || [],
                  summary: d.summary || null,
               });
            } else setData({ grades: [], summary: null });
         })
         .catch(() => setData({ grades: [], summary: null }))
         .finally(() => setLoading(false));
   }, []);

   const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Bảng điểm</h1>
         {loading && <p className="page-common-loading">Đang tải...</p>}
         {!loading && data.summary && (
            <div className="page-common-card" style={{ marginBottom: 24 }}>
               <p><strong>Tổng quan:</strong> Đã chấm {data.summary.graded ?? 0} / {data.summary.total ?? 0}. Trung bình: {data.summary.averagePercentage ?? '-'}%</p>
            </div>
         )}
         {!loading && data.grades.length === 0 && <p className="page-common-empty">Chưa có điểm.</p>}
         {!loading && data.grades.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Bài tập</th>
                        <th>Lớp</th>
                        <th>Hạn nộp</th>
                        <th>Điểm</th>
                        <th>Nhận xét</th>
                     </tr>
                  </thead>
                  <tbody>
                     {data.grades.map((g, i) => (
                        <tr key={g.assignment?._id || i}>
                           <td>{g.assignment?.title}</td>
                           <td>{g.assignment?.class?.name || '-'}</td>
                           <td>{formatDate(g.assignment?.dueDate)}</td>
                           <td>
                              {g.submission?.score != null
                                 ? `${g.submission.score} / ${g.assignment?.maxScore ?? '-'} (${g.submission.percentage ?? '-'}%)`
                                 : '-'}
                           </td>
                           <td>{g.submission?.feedback || '-'}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
