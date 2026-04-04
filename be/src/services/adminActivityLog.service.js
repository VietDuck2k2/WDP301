const AdminActivityLog = require('../models/AdminActivityLog');

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Ngày bắt đầu (00:00:00) theo lịch YYYY-MM-DD (local server). */
const startOfCalendarDay = (isoDate) => {
   if (!isoDate || !ISO_DATE.test(String(isoDate))) return null;
   const [y, m, d] = String(isoDate).split('-').map(Number);
   return new Date(y, m - 1, d, 0, 0, 0, 0);
};

/** Cuối ngày (23:59:59.999) theo lịch YYYY-MM-DD (local server). */
const endOfCalendarDay = (isoDate) => {
   if (!isoDate || !ISO_DATE.test(String(isoDate))) return null;
   const [y, m, d] = String(isoDate).split('-').map(Number);
   return new Date(y, m - 1, d, 23, 59, 59, 999);
};

/**
 * Ghi nhật ký hành động admin (không làm fail luồng chính nếu lỗi).
 */
const log = async (actorId, payload) => {
   if (!actorId) return;
   try {
      await AdminActivityLog.create({
         actor: actorId,
         action: payload.action,
         resourceType: payload.resourceType,
         resourceId: payload.resourceId || null,
         summary: payload.summary || '',
         metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
      });
   } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AdminActivityLog] log failed:', err.message);
   }
};

const list = async ({ page = 1, limit = 30, resourceType, dateFrom, dateTo } = {}) => {
   const query = {};
   if (resourceType && ['class', 'room', 'schedule_template'].includes(String(resourceType))) {
      query.resourceType = resourceType;
   }

   let dFrom = dateFrom ? String(dateFrom).trim() : '';
   let dTo = dateTo ? String(dateTo).trim() : '';
   if (dFrom && dTo && dFrom > dTo) {
      [dFrom, dTo] = [dTo, dFrom];
   }
   const from = dFrom ? startOfCalendarDay(dFrom) : null;
   const to = dTo ? endOfCalendarDay(dTo) : null;
   if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = from;
      if (to) query.createdAt.$lte = to;
   }
   const p = Math.max(1, parseInt(page, 10) || 1);
   const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
   const skip = (p - 1) * l;

   const [items, total] = await Promise.all([
      AdminActivityLog.find(query)
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(l)
         .populate('actor', 'firstName lastName email role')
         .lean(),
      AdminActivityLog.countDocuments(query)
   ]);

   return {
      items,
      pagination: {
         page: p,
         limit: l,
         total,
         pages: Math.ceil(total / l) || 0
      }
   };
};

module.exports = {
   log,
   list
};
