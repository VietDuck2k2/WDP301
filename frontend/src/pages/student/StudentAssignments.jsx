import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';
import '../../pages/PageCommon.css';

export default function StudentAssignments() {
   const [classes, setClasses] = useState([]);
   const [assignments, setAssignments] = useState([]);
   const [classId, setClassId] = useState('');
   const [loading, setLoading] = useState(false);

   useEffect(() => {
      studentApi.getMyClasses().then((res) => {
         if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []);
      }).catch(() => setClasses([]));
   }, []);

   useEffect(() => {
      if (!classId) {
         setAssignments([]);
         return;
      }
      setLoading(true);
      studentApi
         .getClassAssignments(classId)
         .then((res) => {
            if (res?.success && res.data) setAssignments(Array.isArray(res.data) ? res.data : []);
            else setAssignments([]);
         })
         .catch(() => setAssignments([]))
         .finally(() => setLoading(false));
   }, [classId]);

   const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

   return (
      <div className="page-common">
         <h1 className="page-common-title">Bài tập</h1>
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
         {!loading && classId && assignments.length === 0 && <p className="page-common-empty">Không có bài tập.</p>}
         {!loading && assignments.length > 0 && (
            <div className="page-common-card">
               <table className="page-common-table">
                  <thead>
                     <tr>
                        <th>Tiêu đề</th>
                        <th>Hạn nộp</th>
                        <th>Điểm tối đa</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {assignments.map((a) => (
                        <tr key={a._id}>
                           <td>{a.title}</td>
                           <td>{formatDate(a.dueDate)}</td>
                           <td>{a.maxScore ?? '-'}</td>
                           <td>
                              <Link to={`/student/assignments/${a._id}/submit`} className="page-common-link">
                                 Nộp bài
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
