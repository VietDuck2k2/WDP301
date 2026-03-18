import React, { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import adminApi from '../../api/adminApi';

import './Classes.css';



const defaultForm = {

  name: '',

  code: '',

  description: '',

  level: 'beginner',

  capacity: 20,

  startDate: '',

  endDate: '',

  scheduleTemplate: '',

};



const levelOptions = ['beginner', 'elementary', 'intermediate', 'upper-intermediate', 'advanced'];

const statusOptions = ['draft', 'active', 'completed', 'cancelled'];



const toDateInput = (value) => {

  if (!value) return '';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return '';

  return d.toISOString().split('T')[0];

};



const Classes = () => {

  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);

  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });

  const [filters, setFilters] = useState({ status: '', level: '', search: '', page: 1, limit: 20 });

  const [loading, setLoading] = useState(false);

  const [templates, setTemplates] = useState([]);



  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [createForm, setCreateForm] = useState(defaultForm);

  const [creating, setCreating] = useState(false);



  const [editingClass, setEditingClass] = useState(null);

  const [editForm, setEditForm] = useState(defaultForm);

  const [savingEdit, setSavingEdit] = useState(false);



  const fetchClasses = async (params = filters) => {

    setLoading(true);

    try {

      const res = await adminApi.getClasses(params);

      if (res?.success && res?.data) {

        setClasses(res.data.classes || []);

        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });

      }

    } catch (error) {

      console.error('Failed to fetch classes:', error);

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    const debounce = setTimeout(() => fetchClasses(filters), 250);

    return () => clearTimeout(debounce);

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [filters]);

  useEffect(() => {
    adminApi.getScheduleTemplates().then(res => {
      if (res?.success) setTemplates(res.data || []);
    }).catch(() => {});
  }, []);



  const stats = useMemo(() => {

    const active = classes.filter((c) => c.status === 'active').length;

    const completed = classes.filter((c) => c.status === 'completed').length;

    return { active, completed };

  }, [classes]);



  const handlePageChange = (newPage) => {

    setFilters((prev) => ({ ...prev, page: newPage }));

  };



  const handleCreate = async (e) => {

    e.preventDefault();

    setCreating(true);

    try {

      const payload = {
        ...createForm,
        capacity: Number(createForm.capacity),
        startDate: createForm.startDate,
        endDate: createForm.endDate,
      };

      // Don't send empty scheduleTemplate string — BE checks truthiness
      if (!payload.scheduleTemplate) delete payload.scheduleTemplate;

      const res = await adminApi.createClass(payload);

      if (res?.success) {

        setIsCreateOpen(false);

        setCreateForm(defaultForm);

        setFilters((prev) => ({ ...prev, page: 1 }));

      }

    } catch (error) {

      console.error('Create class failed:', error);

      alert(error?.response?.data?.message || 'Create class failed');

    } finally {

      setCreating(false);

    }

  };



  const openEdit = (item) => {

    setEditingClass(item);

    setEditForm({

      name: item.name || '',

      code: item.code || '',

      description: item.description || '',

      level: item.level || 'beginner',

      capacity: item.capacity || 20,

      startDate: toDateInput(item.startDate),

      endDate: toDateInput(item.endDate),

      status: item.status || 'draft',

      scheduleTemplate: item.scheduleTemplate?._id || item.scheduleTemplate || '',

    });

  };



  const handleEdit = async (e) => {

    e.preventDefault();

    if (!editingClass) return;



    setSavingEdit(true);

    try {

      const payload = {
        ...editForm,
        capacity: Number(editForm.capacity),
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      };



      const res = await adminApi.updateClass(editingClass._id, payload);

      if (res?.success) {

        setEditingClass(null);

        fetchClasses(filters);

      }

    } catch (error) {

      console.error('Update class failed:', error);

      alert(error?.response?.data?.message || 'Update class failed');

    } finally {

      setSavingEdit(false);

    }

  };



  const handleDelete = async (classId) => {

    const confirmed = window.confirm('Delete this class? This action cannot be undone.');

    if (!confirmed) return;



    try {

      const res = await adminApi.deleteClass(classId);

      if (res?.success) {

        fetchClasses(filters);

      }

    } catch (error) {

      console.error('Delete class failed:', error);

      alert(error?.response?.data?.message || 'Delete class failed');

    }

  };



  return (

    <div className="admin-classes-page">

      <section className="admin-classes-header">

        <div>

          <h1>Class Management</h1>

          <p>Manage classes, levels, and schedule period</p>

        </div>

        <button type="button" title="Create Class" aria-label="Create Class" onClick={() => setIsCreateOpen(true)}>+</button>

      </section>



      <section className="admin-classes-stats">

        <article><h3>{pagination.total}</h3><p>Total Classes</p></article>

        <article><h3>{stats.active}</h3><p>Active in current page</p></article>

        <article><h3>{stats.completed}</h3><p>Completed in current page</p></article>

      </section>



      <section className="admin-classes-panel">

        <div className="filter-row">

          <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}>

            <option value="">All status</option>

            {statusOptions.map((status) => (

              <option key={status} value={status}>{status}</option>

            ))}

          </select>



          <select value={filters.level} onChange={(e) => setFilters((prev) => ({ ...prev, level: e.target.value, page: 1 }))}>

            <option value="">All levels</option>

            {levelOptions.map((level) => (

              <option key={level} value={level}>{level}</option>

            ))}

          </select>



          <input

            type="text"

            value={filters.search}

            placeholder="Search by class name or code"

            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}

          />

        </div>



        <div className="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>Class</th>

                <th>Level</th>

                <th>Capacity</th>

                <th>Period</th>

                <th>Room</th>

                <th>Status</th>

                <th>Action</th>

              </tr>

            </thead>

            <tbody>

              {!loading && classes.length === 0 && (

                <tr>

                  <td colSpan="7" className="empty-row">No classes found.</td>

                </tr>

              )}



              {classes.map((item) => (

                <tr key={item._id}>

                  <td>

                    <div className="class-name">{item.name}</div>

                    <div className="class-code">{item.code}</div>

                  </td>

                  <td><span className="level-pill">{item.level}</span></td>

                  <td>{item.capacity}</td>

                  <td>

                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}

                  </td>


                  <td><span className={`status-pill ${item.status}`}>{item.status}</span></td>

                  <td>

                    <div className="action-icons">

                      <button

                        type="button"

                        className="icon-btn view"

                        title="View Detail"

                        aria-label="View class detail"

                        onClick={() => navigate(`/admin/classes/${item._id}`)}

                      >

                        👁️

                      </button>

                      <button

                        type="button"

                        className="icon-btn edit"

                        title="Edit"

                        aria-label="Edit class"

                        onClick={() => openEdit(item)}

                      >

                        ✏️

                      </button>

                      <button

                        type="button"

                        className="icon-btn delete"

                        title="Delete"

                        aria-label="Delete class"

                        onClick={() => handleDelete(item._id)}

                      >

                        🗑️

                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>



        <div className="pagination-row">

          <span>Total: {pagination.total}</span>

          <div className="pagination-actions">

            <button

              type="button"

              disabled={pagination.page <= 1}

              onClick={() => handlePageChange(pagination.page - 1)}

            >

              Prev

            </button>

            <span>{pagination.page} / {pagination.pages || 1}</span>

            <button

              type="button"

              disabled={pagination.page >= (pagination.pages || 1)}

              onClick={() => handlePageChange(pagination.page + 1)}

            >

              Next

            </button>

          </div>

        </div>

      </section>



      {isCreateOpen && (

        <div className="modal-overlay" role="presentation" onClick={() => setIsCreateOpen(false)}>

          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>

            <h2>Create Class</h2>

            <form className="modal-form" onSubmit={handleCreate}>

              <div className="double-grid">

                <input

                  placeholder="Class name"

                  value={createForm.name}

                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}

                  required

                />

                <input

                  placeholder="Mã lớp (VD: EBC001)"

                  value={createForm.code}

                  pattern="[A-Za-z]{3}[0-9]{3}"

                  maxLength={6}

                  title="3 chữ cái in hoa + 3 chữ số (VD: EBC001)"

                  onChange={(e) => setCreateForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}

                  required

                />

              </div>



              <input

                placeholder="Description"

                value={createForm.description}

                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}

              />



              <div className="triple-grid">

                <select value={createForm.level} onChange={(e) => setCreateForm((prev) => ({ ...prev, level: e.target.value }))}>

                  {levelOptions.map((level) => (

                    <option key={level} value={level}>{level}</option>

                  ))}

                </select>



                <input

                  type="number"

                  min="1"

                  placeholder="Capacity"

                  value={createForm.capacity}

                  onChange={(e) => setCreateForm((prev) => ({ ...prev, capacity: e.target.value }))}

                  required

                />



              </div>



              <div className="double-grid">

                <input

                  type="date"

                  value={createForm.startDate}

                  onChange={(e) => setCreateForm((prev) => ({ ...prev, startDate: e.target.value }))}

                  required

                />

                <input

                  type="date"

                  value={createForm.endDate}

                  onChange={(e) => setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))}

                  required

                />

              </div>



              <select value={createForm.scheduleTemplate || ''} onChange={(e) => setCreateForm((prev) => ({ ...prev, scheduleTemplate: e.target.value }))}>

                <option value="">-- Không dùng mẫu lịch --</option>

                {templates.map((tpl) => (

                  <option key={tpl._id} value={tpl._id}>{tpl.name}</option>

                ))}

              </select>

              <div className="modal-actions">

                <button type="button" className="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>

                <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Class'}</button>

              </div>

            </form>

          </div>

        </div>

      )}



      {editingClass && (

        <div className="modal-overlay" role="presentation" onClick={() => setEditingClass(null)}>

          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>

            <h2>Edit Class</h2>

            <form className="modal-form" onSubmit={handleEdit}>

              <div className="double-grid">

                <input

                  placeholder="Class name"

                  value={editForm.name}

                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}

                  required

                />

                <input

                  placeholder="Mã lớp (VD: EBC001)"

                  value={editForm.code}

                  pattern="[A-Za-z]{3}[0-9]{3}"

                  maxLength={6}

                  title="3 chữ cái in hoa + 3 chữ số (VD: EBC001)"

                  onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}

                  required

                />

              </div>



              <input

                placeholder="Description"

                value={editForm.description}

                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}

              />



              <div className="triple-grid">

                <select value={editForm.level} onChange={(e) => setEditForm((prev) => ({ ...prev, level: e.target.value }))}>

                  {levelOptions.map((level) => (

                    <option key={level} value={level}>{level}</option>

                  ))}

                </select>



                <input

                  type="number"

                  min="1"

                  placeholder="Capacity"

                  value={editForm.capacity}

                  onChange={(e) => setEditForm((prev) => ({ ...prev, capacity: e.target.value }))}

                  required

                />



              </div>



              <div className="double-grid">

                <input

                  type="date"

                  value={editForm.startDate}

                  onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))}

                  required

                />

                <input

                  type="date"

                  value={editForm.endDate}

                  onChange={(e) => setEditForm((prev) => ({ ...prev, endDate: e.target.value }))}

                  required

                />

              </div>



              <select value={editForm.status || 'draft'} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>

                {statusOptions.map((status) => (

                  <option key={status} value={status}>{status}</option>

                ))}

              </select>

              <select value={editForm.scheduleTemplate || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, scheduleTemplate: e.target.value }))}>

                <option value="">-- Không dùng mẫu lịch --</option>

                {templates.map((tpl) => (

                  <option key={tpl._id} value={tpl._id}>{tpl.name}</option>

                ))}

              </select>



              <div className="modal-actions">

                <button type="button" className="secondary" onClick={() => setEditingClass(null)}>Cancel</button>

                <button type="submit" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

};



export default Classes;

