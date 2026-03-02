import React, { useEffect, useMemo, useState } from 'react';
import adminApi from '../../api/adminApi';
import './Templates.css';

const dayLabels = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getScheduleTemplates();
        if (res?.success) {
          setTemplates(res.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch schedule templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;

    return templates.filter((tpl) =>
      (tpl.name || '').toLowerCase().includes(q)
    );
  }, [templates, search]);

  return (
    <div className="admin-templates-page">
      <section className="admin-templates-header">
        <div>
          <h1>Schedule Templates</h1>
          <p>Manage class schedule patterns by weekdays and time slots</p>
        </div>
      </section>

      <section className="admin-templates-panel">
        <div className="template-toolbar">
          <input
            type="text"
            placeholder="Search template by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span>Total: {filteredTemplates.length}</span>
        </div>

        <div className="template-grid">
          {!loading && filteredTemplates.length === 0 && (
            <div className="empty-box">No schedule templates found.</div>
          )}

          {filteredTemplates.map((tpl) => (
            <article className="template-card" key={tpl._id}>
              <div className="template-card-head">
                <h3>{tpl.name}</h3>
                <small>{new Date(tpl.createdAt).toLocaleDateString()}</small>
              </div>

              <div className="slot-list">
                {(tpl.schedule || []).map((slot, idx) => (
                  <div className="slot-item" key={`${tpl._id}-${idx}`}>
                    <span className="day">{dayLabels[slot.dayOfWeek] || `Day ${slot.dayOfWeek}`}</span>
                    <span className="time">{slot.startTime} - {slot.endTime}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Templates;
