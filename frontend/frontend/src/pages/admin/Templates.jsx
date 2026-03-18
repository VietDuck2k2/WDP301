import React, { useEffect, useMemo, useState, useCallback } from 'react';
import adminApi from '../../api/adminApi';
import { SLOT_DEFINITIONS } from '../../constants/slots';
import './Templates.css';

const DAY_LABELS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const EMPTY_SLOT = { dayOfWeek: 1, slotNumber: 1 };
const EMPTY_FORM = { name: '', description: '', schedule: [{ ...EMPTY_SLOT }] };

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Modal: Create/Edit Template
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Modal: Generate Sessions from Template
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [generateResult, setGenerateResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tplRes, classRes] = await Promise.all([
        adminApi.getScheduleTemplates(),
        adminApi.getClasses({ limit: 100 }),
      ]);
      if (tplRes?.success) setTemplates(tplRes.data || []);
      if (classRes?.success) setClasses(classRes.data?.classes || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? templates.filter(t => t.name?.toLowerCase().includes(q)) : templates;
  }, [templates, search]);

  // --- CRUD Template ---
  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (tpl) => {
    setEditingId(tpl._id);
    setForm({
      name: tpl.name,
      description: tpl.description || '',
      schedule: tpl.schedule.map(s => ({ dayOfWeek: s.dayOfWeek, slotNumber: s.slotNumber ?? 1 }))
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const addSlot = () => setForm(prev => ({ ...prev, schedule: [...prev.schedule, { ...EMPTY_SLOT }] }));
  const removeSlot = (idx) => setForm(prev => ({ ...prev, schedule: prev.schedule.filter((_, i) => i !== idx) }));
  const updateSlot = (idx, field, value) => setForm(prev => {
    const schedule = [...prev.schedule];
    const numFields = ['dayOfWeek', 'slotNumber'];
    schedule[idx] = { ...schedule[idx], [field]: numFields.includes(field) ? Number(value) : value };
    return { ...prev, schedule };
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.schedule.length === 0) { alert('Cần ít nhất 1 slot lịch học.'); return; }
    setSaving(true);
    try {
      const res = editingId
        ? await adminApi.updateScheduleTemplate(editingId, form)
        : await adminApi.createScheduleTemplate(form);
      if (res?.success) { closeModal(); fetchData(); }
    } catch (err) {
      alert(err?.response?.data?.message || 'Lưu template thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa template "${name}"?`)) return;
    try {
      const res = await adminApi.deleteScheduleTemplate(id);
      if (res?.success) fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Xóa template thất bại.');
    }
  };

  // --- Generate Sessions ---
  const openGenerate = (tpl) => {
    setSelectedTemplate(tpl);
    setSelectedClassId('');
    setGenerateResult(null);
    setGenerateOpen(true);
  };
  const closeGenerate = () => { setGenerateOpen(false); setSelectedTemplate(null); };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedClassId) { alert('Vui lòng chọn lớp học.'); return; }
    setGenerating(true);
    try {
      const res = await adminApi.generateSessions({ classId: selectedClassId, templateId: selectedTemplate._id });
      if (res?.success) setGenerateResult(res.data?.length ?? 0);
    } catch (err) {
      alert(err?.response?.data?.message || 'Phát sinh lịch học thất bại.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="admin-templates-page">
      <section className="admin-templates-header">
        <div>
          <h1>Mẫu Lịch học</h1>
          <p>Quản lý các mẫu lịch học theo ngày và khung giờ</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Tạo mới</button>
      </section>

      <section className="admin-templates-panel">
        <div className="template-toolbar">
          <input type="text" placeholder="Tìm theo tên template" value={search} onChange={e => setSearch(e.target.value)} />
          <span>Tổng: {filteredTemplates.length}</span>
        </div>

        <div className="template-grid">
          {loading && <div className="empty-box">Đang tải...</div>}
          {!loading && filteredTemplates.length === 0 && <div className="empty-box">Chưa có mẫu lịch học nào.</div>}
          {filteredTemplates.map(tpl => (
            <article className="template-card" key={tpl._id}>
              <div className="template-card-head">
                <h3>{tpl.name}</h3>
                <div className="template-actions">
                  <button className="btn-icon apply" title="Dùng cho lớp" onClick={() => openGenerate(tpl)}>📅</button>
                  <button className="btn-icon edit" title="Sửa" onClick={() => openEdit(tpl)}>✏️</button>
                  <button className="btn-icon delete" title="Xóa" onClick={() => handleDelete(tpl._id, tpl.name)}>🗑️</button>
                </div>
              </div>
              {tpl.description && <p className="template-desc">{tpl.description}</p>}
              <div className="slot-list">
                {(tpl.schedule || []).map((slot, idx) => {
                  const slotDef = SLOT_DEFINITIONS.find(s => s.slotNumber === slot.slotNumber);
                  return (
                    <div className="slot-item" key={`${tpl._id}-${idx}`}>
                      <span className="day">{DAY_LABELS[slot.dayOfWeek] ?? `Ngày ${slot.dayOfWeek}`}</span>
                      <span className="time">
                        {slotDef ? `${slotDef.label} · ${slotDef.startTime}–${slotDef.endTime}` : `Slot ${slot.slotNumber ?? '?'}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Modal: Create / Edit Template */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card wide" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Chỉnh sửa Template' : 'Tạo mới Template'}</h2>
            <form onSubmit={handleSave} className="modal-form">
              <input placeholder="Tên template *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              <input placeholder="Mô tả (tuỳ chọn)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />

              <div className="slot-editor-header">
                <span>Các slot lịch học</span>
                <button type="button" className="btn-secondary small" onClick={addSlot}>+ Thêm slot</button>
              </div>

              {form.schedule.map((slot, idx) => (
                <div className="slot-editor-row" key={idx}>
                  <select value={slot.dayOfWeek} onChange={e => updateSlot(idx, 'dayOfWeek', e.target.value)}>
                    {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <select value={slot.slotNumber ?? 1} onChange={e => updateSlot(idx, 'slotNumber', e.target.value)}>
                    {SLOT_DEFINITIONS.map(s => (
                      <option key={s.slotNumber} value={s.slotNumber}>
                        {s.label} · {s.startTime}–{s.endTime} ({s.period})
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn-icon delete" onClick={() => removeSlot(idx)} disabled={form.schedule.length === 1}>✕</button>
                </div>
              ))}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Generate Sessions */}
      {generateOpen && selectedTemplate && (
        <div className="modal-overlay" onClick={closeGenerate}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>📅 Phát sinh Lịch học</h2>
            <p className="modal-subtitle">
              Dùng mẫu <strong>"{selectedTemplate.name}"</strong> để tạo lịch học cho lớp.
            </p>

            {generateResult !== null ? (
              <div className="generate-success">
                <p>✅ Đã phát sinh thành công <strong>{generateResult}</strong> buổi học!</p>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={closeGenerate}>Đóng</button>
                  <button className="btn-primary" onClick={() => { setGenerateResult(null); setSelectedClassId(''); }}>
                    Phát sinh cho lớp khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGenerate} className="modal-form">
                <label>Chọn lớp học</label>
                <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} required>
                  <option value="">-- Chọn lớp từ danh sách --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code}) – {c.level}
                    </option>
                  ))}
                </select>
                <p className="hint-text">
                  Hệ thống sẽ tự động tạo các buổi học dựa trên ngày bắt đầu/kết thúc của lớp đã chọn. Các buổi đã tồn tại sẽ được bỏ qua.
                </p>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeGenerate}>Hủy</button>
                  <button type="submit" className="btn-primary" disabled={generating}>
                    {generating ? 'Đang phát sinh...' : 'Phát sinh'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;
