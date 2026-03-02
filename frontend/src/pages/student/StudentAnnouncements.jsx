import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import '../../pages/PageCommon.css';

export default function StudentAnnouncements() {
   const [classes, setClasses] = useState([]);
   const [classId, setClassId] = useState('');
   const [list, setList] = useState([]);
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      studentApi.getMyClasses().then((res) => {
         if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []);
      }).catch(() => setClasses([]));
   }, []);

   useEffect(() => {
      if (!classId) {
         setList([]);
         return;
      }
      setLoading(true);
      studentApi
         .getClassAnnouncements(classId)
         .then((res) => {
            if (res?.success && res.data) setList(Array.isArray(res.data) ? res.data : []);
            else setList([]);
         })
         .catch(() => setList([]))
         .finally(() => setLoading(false));
   }, [classId]);

   const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Thông báo</h1>
         <div className="page-common-toolbar">
            <label>
               Lớp:
               <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="page-common-select"
               >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                     <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
               </select>
            </label>
         </div>
         {loading && <p className="page-common-loading">Đang tải...</p>}
         {!loading && classId && list.length === 0 && <p className="page-common-empty">Không có thông báo.</p>}
         {!loading && list.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Tiêu đề</th>
                        <th>Ưu tiên</th>
                        <th>Ngày đăng</th>
                     </tr>
                  </thead>
                  <tbody>
                     {list.map((a) => (
                        <tr key={a._id}>
                           <td>{a.isPinned && '📌 '}{a.title}</td>
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
