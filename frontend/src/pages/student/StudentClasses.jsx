import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import '../../pages/PageCommon.css';

export default function StudentClasses() {
   const [classes, setClasses] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      studentApi
         .getMyClasses()
         .then((res) => {
            if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []);
            else setClasses([]);
         })
         .catch(() => setClasses([]))
         .finally(() => setLoading(false));
   }, []);

   const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Lớp học của tôi</h1>
         {loading && <p className="page-common-loading">Đang tải...</p>}
         {!loading && classes.length === 0 && <p className="page-common-empty">Bạn chưa đăng ký lớp nào.</p>}
         {!loading && classes.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Mã lớp</th>
                        <th>Tên lớp</th>
                        <th>Trình độ</th>
                        <th>Phòng</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc</th>
                     </tr>
                  </thead>
                  <tbody>
                     {classes.map((c) => (
                        <tr key={c._id}>
                           <td>{c.code}</td>
                           <td>{c.name}</td>
                           <td>{c.level || '-'}</td>
                           <td>{c.room || '-'}</td>
                           <td>{formatDate(c.startDate)}</td>
                           <td>{formatDate(c.endDate)}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
