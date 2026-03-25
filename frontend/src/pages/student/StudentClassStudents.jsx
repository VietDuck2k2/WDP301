import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentApi } from '../../api/studentApi';

export default function StudentClassStudents() {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, classRes] = await Promise.all([
          studentApi.getClassStudents(classId),
          studentApi.getClassById(classId)
        ]);
        if (studentsRes?.success) setStudents(studentsRes.data ?? []);
        if (classRes?.success) setClassInfo(classRes.data);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  return (
    <div className="page-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Link to="/student/classes" className="link">← Quay lại</Link>
        <h1 className="page-title" style={{ margin: 0 }}>
          Danh sách sinh viên {classInfo ? `- ${classInfo.name}` : ''}
        </h1>
      </div>

      {loading ? <p>Đang tải...</p> : (
        <>
          <p className="muted" style={{ marginBottom: 12 }}>
            Tổng số: <strong>{students.length}</strong> sinh viên
          </p>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>STT</th>
                  <th>Mã SV</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                    <td>{s.code || '-'}</td>
                    <td>{[s.lastName, s.firstName].filter(Boolean).join(' ') || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td>{s.phone || '-'}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center' }}>Chưa có sinh viên trong lớp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
