import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import { timetableApi } from '../../api/timetableApi';
import './SessionRooms.css';

const toDateLabel = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN');
};

const SessionRooms = () => {
  const { id } = useParams();
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [classId, setClassId] = useState(id || '');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);

  // selection + saving
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [rowSaving, setRowSaving] = useState({});
  const [assignRoom, setAssignRoom] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [classRes, roomRes] = await Promise.all([
          adminApi.getClasses({ limit: 200 }),
          adminApi.getRooms(),
        ]);
        if (classRes?.success) setClasses(classRes.data?.classes || []);
        if (roomRes?.success) setRooms(roomRes.data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    };
    load();
  }, []);

  const roomOptions = useMemo(() => {
    const list = rooms.map((r) => ({ id: r._id, name: r.name }));
    const unique = Array.from(new Set(list.map((x) => x.name))).map((name) => ({ id: name, name }));
    return unique.sort((a, b) => a.name.localeCompare(b.name));
  }, [rooms]);

  const fetchSessions = async (targetClassId) => {
    if (!targetClassId) return;
    setLoading(true);
    try {
      const res = await timetableApi.getSessions({ classId: targetClassId, limit: 500, page: 1 });
      if (res?.success) {
        setSessions(res.data?.sessions || []);
        setSelectedIds(new Set());
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Không tải được danh sách buổi học.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSessions([]);
    setSelectedIds(new Set());
    setAssignRoom('');
    if (classId) fetchSessions(classId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const toggleSelected = (sessionId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const toggleAll = (checked) => {
    if (!checked) return setSelectedIds(new Set());
    return setSelectedIds(new Set(sessions.map((s) => s._id)));
  };

  const saveRoomForSessions = async (room, sessionIds) => {
    const ids = sessionIds.filter(Boolean);
    if (ids.length === 0) return;
    if (!room) return alert('Vui lòng chọn phòng trước khi lưu.');

    // Mark saving for all targeted rows
    setRowSaving((p) => {
      const next = { ...p };
      ids.forEach((sid) => { next[sid] = true; });
      return next;
    });

    try {
      const results = await Promise.allSettled(
        ids.map((sid) => timetableApi.updateSession(sid, { room }))
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        alert(`Có ${failed.length}/${ids.length} buổi lưu thất bại. Kiểm tra trùng phòng hoặc dữ liệu.`);
      }

      await fetchSessions(classId);
    } catch (e) {
      alert(e?.response?.data?.message || 'Lưu phòng thất bại.');
    } finally {
      setRowSaving((p) => {
        const next = { ...p };
        ids.forEach((sid) => { next[sid] = false; });
        return next;
      });
    }
  };

  return (
    <div className="session-rooms-page">
      <section className="session-rooms-header">
        <div>
          <h1>Gán phòng cho Lịch học</h1>
          <p>Chọn lớp bằng card. Trong danh sách buổi, tích checkbox và bấm “Lưu” để gán phòng cho các buổi đã chọn.</p>
        </div>
      </section>

      {!classId && (
        <section className="class-cards">
          {classes.length === 0 && <div className="empty-box">Chưa có lớp nào.</div>}
          {classes.map((c) => (
            <button
              type="button"
              key={c._id}
              className="class-card"
              onClick={() => setClassId(c._id)}
            >
              <div className="class-card-title">{c.name}</div>
              <div className="class-card-sub">{c.code} • {c.level}</div>
              <div className="class-card-meta">
                <span className={`pill ${c.status}`}>{c.status}</span>
                <span className="meta">{c.startDate ? toDateLabel(c.startDate) : '?' } → {c.endDate ? toDateLabel(c.endDate) : '?'}</span>
              </div>
            </button>
          ))}
        </section>
      )}

      <section className="session-rooms-table">
        {classId && (
          <div className="selected-class-bar">
            <button type="button" className="btn-secondary" onClick={() => setClassId('')}>
              ← Chọn lớp khác
            </button>
            
            <div className="selected-class-hint">
              Đã chọn: <strong>{classes.find((c) => c._id === classId)?.name || 'Lớp'}</strong> •
              Đã tích: <strong>{selectedIds.size}</strong> buổi
            </div>
          </div>
        )}

        {classId && sessions.length > 0 && (
          <div className="assign-bar">
            <label>Chọn phòng</label>
            <select value={assignRoom} onChange={(e) => setAssignRoom(e.target.value)}>
              <option value="">-- Chọn phòng --</option>
              {roomOptions.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-primary"
              disabled={selectedIds.size === 0}
              onClick={() => saveRoomForSessions(assignRoom, Array.from(selectedIds))}
            >
              Lưu ({selectedIds.size})
            </button>
            {selectedIds.size === 0 && <span className="assign-hint">Hãy tick các buổi cần gán phòng</span>}
          </div>
        )}

        {classId && !loading && sessions.length === 0 && (
          <div className="empty-box">Chưa có buổi học nào (hãy phát sinh lịch hoặc tạo buổi trước).</div>
        )}

        {sessions.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === sessions.length}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Chọn tất cả"
                    />
                  </th>
                  <th>Buổi</th>
                  <th>Ngày</th>
                  <th>Slot</th>
                  <th>Giờ</th>
                  <th>Phòng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s._id)}
                        onChange={() => toggleSelected(s._id)}
                        aria-label={`Chọn buổi ${s.sessionNumber}`}
                      />
                    </td>
                    <td>{s.sessionNumber}</td>
                    <td>{toDateLabel(s.date)}</td>
                    <td>{s.slotNumber ?? '-'}</td>
                    <td>{s.startTime ? `${s.startTime}–${s.endTime}` : '-'}</td>
                    <td>{s.room || <span className="muted">Chưa gán</span>}</td>
                    <td>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default SessionRooms;

