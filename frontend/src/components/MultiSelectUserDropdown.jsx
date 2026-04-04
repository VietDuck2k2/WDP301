import React, { useEffect, useMemo, useRef, useState } from 'react';

const userLabel = (u) =>
  `${u.firstName || ''} ${u.lastName || ''} (${u.email || ''})${u.phone ? ` - ${u.phone}` : ''}`.trim();

/**
 * Dropdown: mở ra có ô lọc + danh sách checkbox để chọn nhiều user cùng lúc.
 */
const MultiSelectUserDropdown = ({
  options = [],
  selectedIds = [],
  onSelectionChange,
  placeholder = 'Chọn...',
  searchPlaceholder = 'Lọc theo tên, email, SĐT...',
  emptyLabel = 'Không có mục phù hợp',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((u) => {
      const blob = `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''} ${u.phone || ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [options, search]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const toggleId = (rawId) => {
    const sid = String(rawId);
    const set = new Set(selectedIds.map(String));
    if (set.has(sid)) {
      set.delete(sid);
    } else {
      set.add(sid);
    }
    onSelectionChange(Array.from(set));
  };

  return (
    <div className="member-picker" ref={rootRef}>
      <button
        type="button"
        className={`member-picker-trigger${selectedIds.length === 0 ? ' member-picker-trigger--placeholder' : ''}`}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) setSearch('');
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="member-picker-trigger-text">
          {selectedIds.length === 0 ? placeholder : `Đã chọn ${selectedIds.length} người`}
        </span>
        <span className="member-picker-chevron" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="member-picker-panel" role="listbox">
          <input
            ref={searchRef}
            type="search"
            className="member-picker-search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            autoComplete="off"
          />
          <ul className="member-picker-list">
            {filtered.length === 0 ? (
              <li className="member-picker-empty">{emptyLabel}</li>
            ) : (
              filtered.map((u) => {
                const idStr = String(u._id);
                const checked = selectedIds.map(String).includes(idStr);
                return (
                  <li key={u._id}>
                    <label className="member-picker-item">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleId(u._id)}
                      />
                      <span className="member-picker-item-label">{userLabel(u)}</span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectUserDropdown;
