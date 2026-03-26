import React, { useEffect, useMemo, useState } from 'react';
import adminApi from '../../api/adminApi';
import './Users.css';

const emptyCreateForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'student',
  phone: '',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [filters, setFilters] = useState({ role: '', search: '', page: 1, limit: 20 });
  const [loading, setLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [savingCreate, setSavingCreate] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', isActive: true, newPassword: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Import modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [defaultPassword, setDefaultPassword] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const fetchUsers = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(nextFilters);
      if (res?.success && res?.data) {
        setUsers(res.data.users || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0, limit: 20 });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers(filters);
    }, 250);

    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const stats = useMemo(() => {
    const teachers = users.filter((u) => u.role === 'teacher').length;
    const students = users.filter((u) => u.role === 'student').length;
    const active = users.filter((u) => u.isActive).length;
    return { teachers, students, active };
  }, [users]);

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSavingCreate(true);
    try {
      const payload = { ...createForm };
      const res = await adminApi.createUser(payload);
      if (res?.success) {
        setIsCreateOpen(false);
        setCreateForm(emptyCreateForm);
        setFilters((prev) => ({ ...prev, page: 1 }));
      }
    } catch (error) {
      console.error('Create user failed:', error);
      alert(error?.response?.data?.message || 'Create user failed');
    } finally {
      setSavingCreate(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || user.phoneNumber || '',
      isActive: Boolean(user.isActive),
      newPassword: '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setSavingEdit(true);
    try {
      // Update profile fields (including email)
      const { newPassword, ...profileData } = editForm;
      const res = await adminApi.updateUser(editingUser._id, profileData);

      // If password was provided, reset it separately
      if (newPassword && newPassword.trim().length > 0) {
        await adminApi.resetPassword(editingUser._id, newPassword.trim());
      }

      if (res?.success) {
        setEditingUser(null);
        fetchUsers(filters);
      }
    } catch (error) {
      console.error('Update user failed:', error);
      alert(error?.response?.data?.message || 'Update user failed');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmed) return;

    try {
      const res = await adminApi.deleteUser(userId);
      if (res?.success) {
        fetchUsers(filters);
      }
    } catch (error) {
      console.error('Delete user failed:', error);
      alert(error?.response?.data?.message || 'Delete user failed');
    }
  };

  // ---- Import handlers ----
  const downloadTemplate = async () => {
    try {
      const res = await adminApi.downloadImportTemplate();
      const url = window.URL.createObjectURL(new Blob([res]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_import_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download template failed:', error);
      alert('Tải template thất bại');
    }
  };

  const handlePreviewImport = async (file) => {
    setImportFile(file);
    setImportPreview(null);
    setImportResult(null);
    setPreviewing(true);
    try {
      const res = await adminApi.previewImport(file);
      if (res?.success && res?.data) {
        setImportPreview(res.data);
        // Auto-fill default password hint
        const firstReady = res.data.rows?.find(r => r.status === 'ready');
        if (firstReady) {
          setDefaultPassword(firstReady.email.split('@')[0] + '123');
        }
      }
    } catch (error) {
      console.error('Preview import failed:', error);
      alert(error?.response?.data?.message || 'Preview thất bại');
    } finally {
      setPreviewing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!importPreview) return;
    const readyRows = importPreview.rows.filter(r => r.status === 'ready');
    if (readyRows.length === 0) return;

    setImporting(true);
    try {
      const res = await adminApi.executeImport({
        rows: readyRows,
        defaultPassword: defaultPassword || null
      });
      if (res?.success && res?.data) {
        setImportResult(res.data);
        fetchUsers(filters);
      }
    } catch (error) {
      console.error('Execute import failed:', error);
      alert(error?.response?.data?.message || 'Import thất bại');
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setIsImportOpen(false);
    setImportFile(null);
    setImportPreview(null);
    setImportResult(null);
    setDefaultPassword('');
  };

  return (
    <div className="admin-users-page">
      <section className="admin-users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage students, teachers, and admin accounts</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-template" title="Tải Template Excel" onClick={downloadTemplate}>📥 Template</button>
          <button type="button" className="btn-import" title="Import từ Excel" onClick={() => setIsImportOpen(true)}>📤 Import</button>
          <button type="button" title="Create User" aria-label="Create User" onClick={() => setIsCreateOpen(true)}>+</button>
        </div>
      </section>

      <section className="admin-users-stats">
        <article><h3>{pagination.total}</h3><p>Total Users</p></article>
        <article><h3>{stats.active}</h3><p>Active in current page</p></article>
        <article><h3>{stats.teachers}</h3><p>Teachers in current page</p></article>
        <article><h3>{stats.students}</h3><p>Students in current page</p></article>
      </section>

      <section className="admin-users-panel">
        <div className="filter-row">
          <select
            value={filters.role}
            onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }))}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          <input
            type="text"
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-row">No users found.</td>
                </tr>
              )}

              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td><span className={`role-pill ${user.role}`}>{user.role}</span></td>
                  <td>{user.phone || user.phoneNumber || '-'}</td>
                  <td>
                    <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-icons">
                      <button
                        type="button"
                        className="icon-btn edit"
                        title="Edit"
                        aria-label="Edit user"
                        onClick={() => openEdit(user)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="icon-btn delete"
                        title="Delete"
                        aria-label="Delete user"
                        onClick={() => handleDelete(user._id)}
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
            <h2>Create User</h2>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="double-grid">
                <input
                  placeholder="First name"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
                <input
                  placeholder="Last name"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={createForm.password}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <div className="double-grid">
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  placeholder="Phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" disabled={savingCreate}>{savingCreate ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" role="presentation" onClick={() => setEditingUser(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Chỉnh sửa tài khoản</h2>
            <form className="modal-form" onSubmit={handleEdit}>
              <div className="double-grid">
                <input
                  placeholder="Tên"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
                <input
                  placeholder="Họ"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>

              <label className="field-label">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />

              <input
                placeholder="Số điện thoại"
                value={editForm.phone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              />

              <hr className="form-divider" />

              <label className="field-label">Đổi mật khẩu <span className="hint">(để trống nếu không đổi)</span></label>
              <input
                type="text"
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                value={editForm.newPassword}
                onChange={(e) => setEditForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                minLength={editForm.newPassword ? 6 : undefined}
                autoComplete="off"
              />

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Tài khoản hoạt động
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" disabled={savingEdit}>{savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportOpen && (
        <div className="modal-overlay" role="presentation" onClick={closeImportModal}>
          <div className="modal-card import-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>📤 Import Học Sinh từ Excel</h2>

            {!importResult ? (
              <>
                {/* File picker */}
                <div className="import-upload-area">
                  <label className="file-picker-label">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePreviewImport(file);
                      }}
                      style={{ display: 'none' }}
                    />
                    <span className="file-picker-btn">
                      {importFile ? importFile.name : 'Chọn file Excel (.xlsx)'}
                    </span>
                  </label>
                  {previewing && <p className="import-hint">Đang đọc file...</p>}
                </div>

                {/* Preview table */}
                {importPreview && (
                  <>
                    <div className="import-summary">
                      <span className="import-count ready">✅ {importPreview.summary.valid} sẵn sàng</span>
                      <span className="import-count error">❌ {importPreview.summary.invalid} lỗi</span>
                      <span>Tổng: {importPreview.summary.total}</span>
                    </div>

                    <div className="import-table-wrapper">
                      <table className="import-preview-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Email</th>
                            <th>Họ</th>
                            <th>Tên</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.rows.map((row, idx) => (
                            <tr key={idx} className={row.status === 'error' ? 'row-error' : 'row-ready'}>
                              <td>{row.rowIndex}</td>
                              <td>{row.email || <em>-</em>}</td>
                              <td>{row.lastName || <em>-</em>}</td>
                              <td>{row.firstName || <em>-</em>}</td>
                              <td>
                                {row.status === 'ready'
                                  ? <span className="status-ready">✅ Sẵn sàng</span>
                                  : <span className="status-error" title={row.errors.join(', ')}>❌ {row.errors[0]}</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Default password */}
                    <div className="import-password-row">
                      <label>Mật khẩu mặc định:</label>
                      <input
                        type="text"
                        value={defaultPassword}
                        onChange={(e) => setDefaultPassword(e.target.value)}
                        placeholder="emailPrefix + 123"
                      />
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="secondary" onClick={closeImportModal}>Hủy</button>
                      <button
                        type="button"
                        disabled={importing || importPreview.summary.valid === 0}
                        onClick={handleExecuteImport}
                      >
                        {importing ? 'Đang import...' : `Import ${importPreview.summary.valid} học sinh`}
                      </button>
                    </div>
                  </>
                )}

                {!importPreview && !previewing && (
                  <div className="modal-actions">
                    <button type="button" className="secondary" onClick={closeImportModal}>Đóng</button>
                  </div>
                )}
              </>
            ) : (
              /* Result screen */
              <div className="import-result">
                <div className="import-result-summary">
                  <div className="result-card success">
                    <h3>{importResult.summary.success}</h3>
                    <p>Tạo thành công</p>
                  </div>
                  <div className="result-card failure">
                    <h3>{importResult.summary.failed}</h3>
                    <p>Thất bại</p>
                  </div>
                </div>

                {importResult.failed.length > 0 && (
                  <div className="import-failed-list">
                    <h4>Chi tiết lỗi:</h4>
                    <ul>
                      {importResult.failed.map((f, i) => (
                        <li key={i}><strong>{f.email}</strong>: {f.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" onClick={closeImportModal}>Đóng</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
