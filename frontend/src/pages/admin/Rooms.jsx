import React, { useEffect, useCallback, useState } from 'react';
import adminApi from '../../api/adminApi';
import './Rooms.css';

const EMPTY_FORM = { name: '', capacity: 30, location: '', description: '' };

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
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
          <h1>Quản lý Phòng học</h1>
          <p>Danh sách các phòng học tại trung tâm</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Thêm phòng</button>
      </section>

      <section className="rooms-panel">
        {loading && <div className="empty-box">Đang tải...</div>}
        {!loading && rooms.length === 0 && <div className="empty-box">Chưa có phòng học nào.</div>}
        <div className="rooms-grid">
          {rooms.map(room => (
            <article className="room-card" key={room._id}>
              <div className="room-card-head">
                <span className="room-icon">🏫</span>
                <div className="room-name">{room.name}</div>
                <div className="room-actions">
                  <button className="btn-icon edit" title="Sửa" onClick={() => openEdit(room)}>✏️</button>
                  <button className="btn-icon delete" title="Xóa" onClick={() => handleDelete(room._id, room.name)}>🗑️</button>
                </div>
              </div>
              <div className="room-info">
                <span>👥 Sức chứa: <strong>{room.capacity}</strong></span>
                {room.location && <span>📍 {room.location}</span>}
                {room.description && <p className="room-desc">{room.description}</p>}
              </div>
            </article>
          ))}
        </div>
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
