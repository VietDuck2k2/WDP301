import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';
import '../../pages/PageCommon.css';

const STATUS_OPTIONS = [
   { value: 'present', label: 'Có mặt' },
   { value: 'absent', label: 'Vắng' },
   { value: 'late', label: 'Muộn' },
   { value: 'excused', label: 'Có phép' },
];

export default function TeacherAttendance() {
   const { sessionId } = useParams();
   const navigate = useNavigate();
   const [list, setList] = useState([]);
   const [attendance, setAttendance] = useState({});
   const [loading, setLoading] = useState(true);
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState('');

   useEffect(() => {
      if (!sessionId) {
         setLoading(false);
         return;
      }
      setLoading(true);
      teacherApi
         .getSessionAttendance(sessionId)
         .then((res) => {
            if (res?.success && res.data) {
               const arr = Array.isArray(res.data) ? res.data : [];
               setList(arr);
               const init = {};
               arr.forEach((item) => {
                  const id = item.student?._id;
                  if (id) init[id] = { status: item.status || 'present', notes: item.notes || '' };
               });
               setAttendance(init);
            } else setList([]);
         })
         .catch(() => {
            setError('Không tải được danh sách điểm danh.');
            setList([]);
         })
         .finally(() => setLoading(false));
   }, [sessionId]);

   const handleSubmit = async () => {
      setSubmitting(true);
      setError('');
      const attendanceList = Object.entries(attendance).map(([studentId, data]) => ({
         studentId,
         status: data.status,
         notes: data.notes || '',
      }));
      try {
         const res = await teacherApi.bulkMarkAttendance(sessionId, { attendanceList });
         if (res?.success) {
            alert('Điểm danh thành công!');
            navigate('/teacher/attendance');
         } else setError(res?.message || 'Lưu thất bại.');
      } catch (_) {
         setError('Lưu điểm danh thất bại.');
      }
      setSubmitting(false);
   };

   if (!sessionId) {
      return (
         <div className="page-common">
            <h1 className="page-common-title">Điểm danh</h1>
            <p className="page-common-empty">Chọn một buổi học từ trang Buổi học để điểm danh.</p>
            <button type="button" className="page-common-btn" onClick={() => navigate('/teacher/sessions')}>
               Xem buổi học
            </button>
         </div>
      );
   }

   if (loading) return <div className="page-common"><p className="page-common-loading">Đang tải...</p></div>;

   return (
      <div className="page-common">
         <h1 className="page-common-title">Điểm danh buổi học</h1>
         {error && <p className="page-common-error">{error}</p>}
         <div className="page-common-card">
            <table className="page-common-table">
               <thead>
                  <tr>
                     <th>Học sinh</th>
                     <th>Trạng thái</th>
                     <th>Ghi chú</th>
                  </tr>
               </thead>
               <tbody>
                  {list.map((item) => {
                     const id = item.student?._id;
                     if (!id) return null;
                     const name = [item.student?.firstName, item.student?.lastName].filter(Boolean).join(' ');
                     const val = attendance[id] || { status: 'present', notes: '' };
                     return (
                        <tr key={id}>
                           <td>{name || item.student?.email}</td>
                           <td>
                              <select
                                 value={val.status}
                                 onChange={(e) =>
                                    setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], status: e.target.value } }))
                                 }
                                 className="page-common-select"
                              >
                                 {STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                       {o.label}
                                    </option>
                                 ))}
                              </select>
                           </td>
                           <td>
                              <input
                                 type="text"
                                 value={val.notes}
                                 onChange={(e) =>
                                    setAttendance((prev) => ({ ...prev, [id]: { ...prev[id], notes: e.target.value } }))
                                 }
                                 className="page-common-input"
                                 placeholder="Ghi chú"
                              />
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
            <div className="page-common-toolbar" style={{ marginTop: 16 }}>
               <button
                  type="button"
                  className="page-common-btn page-common-btn-primary"
                  onClick={handleSubmit}
                  disabled={submitting}
               >
                  {submitting ? 'Đang lưu...' : 'Lưu điểm danh'}
               </button>
               <button type="button" className="page-common-btn" onClick={() => navigate('/teacher/sessions')}>
                  Quay lại
               </button>
            </div>
         </div>
      </div>
   );
}
