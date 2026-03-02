import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../api/teacherApi';
import '../../pages/PageCommon.css';

export default function TeacherAnnouncements() {
   const [list, setList] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   useEffect(() => {
      teacherApi
         .getAnnouncements()
         .then((res) => {
            if (res?.success && res.data) setList(Array.isArray(res.data) ? res.data : []);
            else setList([]);
         })
         .catch(() => setList([]))
         .finally(() => setLoading(false));
   }, []);

   const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Thông báo</h1>
         {error && <p className="page-common-error">{error}</p>}
         {loading && <p className="page-common-loading">Đang tải...</p>}
         {!loading && list.length === 0 && <p className="page-common-empty">Chưa có thông báo.</p>}
         {!loading && list.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Tiêu đề</th>
                        <th>Lớp</th>
                        <th>Ưu tiên</th>
                        <th>Ngày tạo</th>
                     </tr>
                  </thead>
                  <tbody>
                     {list.map((a) => (
                        <tr key={a._id}>
                           <td>{a.isPinned && '📌 '}{a.title}</td>
                           <td>{a.class?.name || '-'}</td>
                           <td>{a.priority || 'normal'}</td>
                           <td>{formatDate(a.createdAt)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
