import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import '../../pages/PageCommon.css';

export default function TeacherSessions() {
   const [classes, setClasses] = useState([]);
   const [sessions, setSessions] = useState([]);
   const [selectedClassId, setSelectedClassId] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   useEffect(() => {
      const load = async () => {
         try {
            const res = await teacherApi.getMyClasses();
            if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []);
         } catch (_) {
            setError('Không tải được danh sách lớp.');
         }
      };
      load();
   }, []);

   useEffect(() => {
      if (!selectedClassId) {
         setSessions([]);
         return;
      }
      setLoading(true);
      setError('');
      teacherApi
         .getClassSessions(selectedClassId)
         .then((res) => {
            if (res?.success && res.data) setSessions(Array.isArray(res.data) ? res.data : res.data.sessions || []);
            else setSessions([]);
         })
         .catch(() => {
            setError('Không tải được buổi học.');
            setSessions([]);
         })
         .finally(() => setLoading(false));
   }, [selectedClassId]);

   const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
   const formatTime = (s, e) => (s && e ? `${s} - ${e}` : '');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Buổi học</h1>
         <div className="page-common-toolbar">
            <label>
               Lớp:
               <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="page-common-select"
               >
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((c) => (
                     <option key={c._id} value={c._id}>
                        {c.name} ({c.code})
                     </option>
                  ))}
               </select>
            </label>
         </div>
         {error && <p className="page-common-error">{error}</p>}
         {loading && <p className="page-common-loading">Đang tải...</p>}
         {!loading && sessions.length === 0 && selectedClassId && <p className="page-common-empty">Chưa có buổi học.</p>}
         {!loading && sessions.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Buổi</th>
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Phòng</th>
                        <th>Trạng thái</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {sessions.map((s) => (
                        <tr key={s._id}>
                           <td>{s.title || `Session ${s.sessionNumber}`}</td>
                           <td>{formatDate(s.date)}</td>
                           <td>{formatTime(s.startTime, s.endTime)}</td>
                           <td>{s.room || '-'}</td>
                           <td>{s.status || '-'}</td>
                           <td>
                              <Link to={`/teacher/attendance/${s._id}`} className="page-common-link">
                                 Điểm danh
                              </Link>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         )}
      </div>
   );
}
