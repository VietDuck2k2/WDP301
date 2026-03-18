import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '-');

export default function StudentAssignments() {
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(classIdParam || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getClasses().then((res) => { if (res?.success && res.data) setClasses(Array.isArray(res.data) ? res.data : []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    if (classId) {
      studentApi.getClassAssignments(classId)
        .then((res) => { if (res?.success && res.data) setAssignments(Array.isArray(res.data) ? res.data : []); })
        .catch(() => setAssignments([]))
        .finally(() => setLoading(false));
    } else if (classes.length > 0) {
      Promise.all(classes.map((c) => studentApi.getClassAssignments(c._id)))
        .then((results) => {
          const all = results.flatMap((res) => (res?.success && res.data ? (Array.isArray(res.data) ? res.data : []) : []));
          setAssignments(all);
        })
        .catch(() => setAssignments([]))
        .finally(() => setLoading(false));
    } else {
      setAssignments([]);
      setLoading(false);
    }
  }, [classId, classes]);

  return (
    <div className="page-card">
      <h1 className="page-title">Bài tập</h1>
      <div className="toolbar">
        <select value={classId} onChange={(e) => setClassId(e.target.value)} className="form-select">
          <option value="">Tất cả lớp</option>
          {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Tiêu đề</th><th>Lớp</th><th>Hạn nộp</th><th>Điểm tối đa</th><th></th></tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a._id}>
                  <td>{a.title}</td>
                  <td>{a.class?.name}</td>
                  <td>{formatDate(a.dueDate)}</td>
                  <td>{a.maxScore}</td>
                  <td><Link to={`/student/assignments/${a._id}/submit`} className="link">Nộp bài</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignments.length === 0 && <p className="empty">Chưa có bài tập.</p>}
        </div>
      )}
    </div>
  );
}
