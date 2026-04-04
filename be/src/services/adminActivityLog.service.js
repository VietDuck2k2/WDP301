const AdminActivityLog = require('../models/AdminActivityLog');

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

const list = async ({ page = 1, limit = 30, resourceType } = {}) => {
   const query = {};
   if (resourceType && ['class', 'room', 'schedule_template'].includes(String(resourceType))) {
      query.resourceType = resourceType;
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
