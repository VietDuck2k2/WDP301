import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

export default function StudentGrades() {
  const [data, setData] = useState({ grades: [], summary: null });
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getClasses().then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    const api = classId ? studentApi.getMyGradesByClass(classId) : studentApi.getMyGrades();
    api
      .then((res) => {
        if (res?.success && res.data) {
          setData({
            grades: res.data.grades || res.data || [],
            summary: res.data.summary || null,
          });
        } else setData({ grades: [], summary: null });
      })
      .catch(() => setData({ grades: [], summary: null }))
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <div className="page-card">
      <h1 className="page-title">Bảng điểm</h1>
      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="form-select">
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      {data.summary && (
        <div className="summary-card">
          <p>Đã chấm: {data.summary.graded} · Chờ chấm: {data.summary.pending} · Chưa nộp: {data.summary.notSubmitted}</p>
          {data.summary.averagePercentage != null && <p>Điểm trung bình: {data.summary.averagePercentage}%</p>}
        </div>
      )}
      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Bài tập</th><th>Lớp</th><th>Hạn nộp</th><th>Điểm</th><th>Trạng thái</th><th>Nhận xét</th></tr>
            </thead>
            <tbody>
              {(data.grades || []).map((g, i) => (
                <tr key={g.assignment?._id || i}>
                  <td>{g.assignment?.title}</td>
                  <td>{g.assignment?.class?.name}</td>
                  <td>{formatDate(g.assignment?.dueDate)}</td>
                  <td>{g.submission?.score != null ? `${g.submission.score} (${g.submission.percentage ?? ''}%)` : '-'}</td>
                  <td>{g.submission?.status || 'Chưa nộp'}</td>
                  <td>{g.submission?.feedback || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data.grades || data.grades.length === 0) && <p className="empty">Chưa có dữ liệu điểm.</p>}
        </div>
      )}
    </div>
  );
}
