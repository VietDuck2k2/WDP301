import React, { useEffect, useState, useCallback } from 'react';
import adminApi from '../../api/adminApi';

const ACTION_LABEL = {
  'class.create': 'Tạo lớp',
  'class.update': 'Cập nhật lớp',
  'class.delete': 'Vô hiệu hóa lớp',
  'room.create': 'Tạo phòng học',
  'room.update': 'Cập nhật phòng học',
  'room.delete': 'Vô hiệu hóa phòng học',
  'schedule_template.create': 'Tạo mẫu lịch học',
  'schedule_template.update': 'Cập nhật mẫu lịch học',
  'schedule_template.delete': 'Vô hiệu hóa mẫu lịch học',
};

const RESOURCE_LABEL = {
  class: 'Lớp học',
  room: 'Phòng học',
  schedule_template: 'Mẫu lịch học',
};

const AdminActivityLogs = () => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [resourceType, setResourceType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (resourceType) params.resourceType = resourceType;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await adminApi.getActivityLogs(params);
      if (res?.success && res.data) {
        setItems(res.data.items || []);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [resourceType, dateFrom, dateTo]);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="max-w-[1400px] mx-auto fade-in pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
          Nhật ký hoạt động admin
        </h1>
        <p className="text-on-surface-variant mt-2 font-body">
          Theo dõi ai đã tạo / sửa / vô hiệu hóa lớp học, phòng học và mẫu lịch học.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <label className="text-sm font-semibold text-on-surface flex flex-col gap-1.5">
          <span className="text-on-surface-variant font-medium">Lọc theo loại</span>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
          >
            <option value="">Tất cả</option>
            <option value="class">Lớp học</option>
            <option value="room">Phòng học</option>
            <option value="schedule_template">Mẫu lịch học</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold text-on-surface flex flex-col gap-1.5">
            <span className="text-on-surface-variant font-medium">Từ ngày</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary min-w-[160px]"
            />
          </label>
          <label className="text-sm font-semibold text-on-surface flex flex-col gap-1.5">
            <span className="text-on-surface-variant font-medium">Đến ngày</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary min-w-[160px]"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-3 py-2 rounded-lg text-sm font-semibold border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
            >
              Xóa ngày
            </button>
          )}
        </div>
        <span className="text-sm text-on-surface-variant pb-2">
          {pagination.total > 0 ? `${pagination.total} bản ghi` : ''}
        </span>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 whisper-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Admin thực hiện</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Loại</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hành động</th>
                <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Đang tải...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    Chưa có nhật ký nào. Các thao tác mới (tạo lớp, phòng, mẫu lịch…) sẽ hiển thị tại đây.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString('vi-VN')
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {row.actor ? (
                        <div>
                          <div className="font-semibold text-slate-800">
                            {row.actor.firstName} {row.actor.lastName}
                          </div>
                          <div className="text-xs text-slate-500">{row.actor.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                        {RESOURCE_LABEL[row.resourceType] || row.resourceType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">
                      {ACTION_LABEL[row.action] || row.action}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 max-w-md">
                      {row.summary || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-sm text-slate-600">
              Trang {pagination.page} / {pagination.pages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 bg-white disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages}
                onClick={() => load(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 bg-white disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLogs;
