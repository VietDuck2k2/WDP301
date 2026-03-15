import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/teacherApi';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    teacherApi.getMyClasses()
      .then(res => {
        if (res?.success && res.data) {
          setClasses(res.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-card">
      <h1 className="page-title">Lớp học của tôi</h1>
      <p className="muted">Danh sách các lớp bạn đang được phân công giảng dạy.</p>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã lớp</th>
                <th>Tên lớp</th>
                <th>Sĩ số</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c._id}>
                  <td>{c.code}</td>
                  <td>{c.name}</td>
                  <td>{c.capacity || '-'}</td>
                  <td>
                    <span className={`status-badge ${c.status === 'active' ? 'active' : 'inactive'}`}>
                      {c.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="link" 
                      onClick={() => navigate(`/teacher/classes/${c._id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {classes.length === 0 && <p className="empty">Bạn chưa được phân công lớp nào.</p>}
        </div>
      )}
    </div>
  );
}
