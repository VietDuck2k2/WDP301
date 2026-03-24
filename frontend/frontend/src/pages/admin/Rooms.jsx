import React, { useEffect, useCallback, useMemo, useState } from 'react';
import adminApi from '../../api/adminApi';
import { timetableApi } from '../../api/timetableApi';
import './Rooms.css';

const EMPTY_FORM = { name: '', capacity: 30, location: '', description: '' };

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day; // Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableData, setTimetableData] = useState(null);

  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRooms();
      if (res?.success) setRooms(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phòng:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const toYYYYMMDD = useMemo(() => {
    return (d) => {
      if (!d) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
  }, []);

  const dayOrder = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
  const slotNumbers = useMemo(() => [1, 2, 3, 4, 5], []);

  const fetchTimetable = useCallback(async () => {
    if (!weekStart) return;
    setTimetableLoading(true);
    try {
      const res = await timetableApi.getAdminTimetable({ weekStart: toYYYYMMDD(weekStart) });
      if (res?.success) setTimetableData(res.data || null);
    } catch (e) {
      console.error(e);
      setTimetableData(null);
    } finally {
      setTimetableLoading(false);
    }
  }, [toYYYYMMDD, weekStart]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (room) => { setEditingId(room._id); setForm({ name: room.name, capacity: room.capacity, location: room.location || '', description: room.description || '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = editingId
        ? await adminApi.updateRoom(editingId, form)
        : await adminApi.createRoom(form);
      if (res?.success) { closeModal(); fetchRooms(); }
    } catch (err) {
      alert(err?.response?.data?.message || 'Lưu phòng thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const roomUsage = useMemo(() => {
    // roomUsage.get(roomName).get(dayName) = Set(slotNumber)
    const usage = new Map();
    const timetable = timetableData?.timetable || {};
    for (const dayName of Object.keys(timetable)) {
      const list = timetable[dayName] || [];
      for (const s of list) {
        if (!s?.room) continue;
        if (s.status === 'cancelled') continue;
        const roomName = String(s.room);
        const slot = Number(s.slotNumber);
        if (!Number.isFinite(slot)) continue;
        if (!usage.has(roomName)) usage.set(roomName, new Map());
        const dayMap = usage.get(roomName);
        if (!dayMap.has(dayName)) dayMap.set(dayName, new Set());
        dayMap.get(dayName).add(slot);
      }
    }
    return usage;
  }, [timetableData]);

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
    return `${fmt(start)} - ${fmt(end)}`;
  }, [weekStart]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa phòng "${name}"?`)) return;
    try {
      const res = await adminApi.deleteRoom(id);
      if (res?.success) fetchRooms();
    } catch (err) {
      alert(err?.response?.data?.message || 'Xóa phòng thất bại.');
    }
  };

  return (
    <div className="admin-rooms-page">
      <section className="admin-rooms-header">
        <div>
          <h1>Lịch phòng theo tuần</h1>
          <p>Mỗi ô đánh dấu ✓ nếu phòng có buổi học đúng ngày và slot</p>
        </div>
        <div className="rooms-header-actions">
          <button className="btn-primary" onClick={openCreate}>
            + Thêm phòng
          </button>
          <div className="rooms-week-label-inline">{weekLabel}</div>
        </div>
      </section>

      <section className="rooms-panel">
        <div className="rooms-week-controls">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const n = new Date(weekStart);
              n.setDate(n.getDate() - 7);
              setWeekStart(n);
            }}
          >
            ← Tuần trước
          </button>
          <div className="rooms-week-label">{weekLabel}</div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const n = new Date(weekStart);
              n.setDate(n.getDate() + 7);
              setWeekStart(n);
            }}
          >
            Tuần sau →
          </button>
        </div>

        {loading && <div className="empty-box">Đang tải...</div>}
        {!loading && rooms.length === 0 && <div className="empty-box">Chưa có phòng học nào.</div>}

        {!loading && rooms.length > 0 && (
          <>
            {timetableLoading && <div className="empty-box">Đang tải lịch phòng...</div>}
            {!timetableLoading && (
              <div className="rooms-table-wrapper">
                <table className="rooms-table">
                  <thead>
                    <tr>
                      <th className="rooms-table-col-room" rowSpan={2}>Room</th>
                      {dayOrder.map((day) => (
                        <th key={day} colSpan={slotNumbers.length} className="rooms-table-col-day">
                          {day}
                        </th>
                      ))}
                    </tr>
                    <tr>
                      {dayOrder.flatMap((dayName) =>
                        slotNumbers.map((slot) => (
                          <th key={`${dayName}-${slot}`} className="rooms-table-col-slot">
                            Slot {slot}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room._id}>
                        <td className="rooms-table-cell-room">{room.name}</td>
                        {dayOrder.flatMap((dayName) =>
                          slotNumbers.map((slot) => {
                            const dayMap = roomUsage.get(String(room.name));
                            const used = dayMap?.get(dayName)?.has(slot);
                            return (
                              <td
                                key={`${room._id}-${dayName}-${slot}`}
                                className={`rooms-table-cell ${used ? 'used' : ''}`}
                              >
                                {used ? '✓' : '-'}
                              </td>
                            );
                          })
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Chỉnh sửa phòng học' : 'Thêm phòng học mới'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <input placeholder="Tên phòng (VD: A101) *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <input type="number" min="1" placeholder="Sức chứa" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
              <input placeholder="Vị trí / Tầng (VD: Tầng 3 - Khu B)" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              <textarea placeholder="Ghi chú phòng..." rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
