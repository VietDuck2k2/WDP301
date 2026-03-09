/**
 * Định nghĩa 5 slot thời gian cố định trong ngày (Frontend).
 */
export const SLOT_DEFINITIONS = [
   { slotNumber: 1, label: 'Slot 1', startTime: '07:30', endTime: '09:50', period: 'Sáng' },
   { slotNumber: 2, label: 'Slot 2', startTime: '10:00', endTime: '12:20', period: 'Trưa' },
   { slotNumber: 3, label: 'Slot 3', startTime: '12:50', endTime: '15:10', period: 'Chiều sớm' },
   { slotNumber: 4, label: 'Slot 4', startTime: '15:20', endTime: '17:40', period: 'Chiều' },
   { slotNumber: 5, label: 'Slot 5', startTime: '19:30', endTime: '21:50', period: 'Tối' },
];

/** Lấy slot theo số thứ tự (1-5). */
export const getSlotByNumber = (n) => SLOT_DEFINITIONS.find(s => s.slotNumber === n) ?? null;

/** Lấy slot theo startTime ngược, dùng cho các session cũ chưa có slotNumber. */
export const getSlotByStartTime = (startTime) => SLOT_DEFINITIONS.find(s => s.startTime === startTime) ?? null;

/** Format label đầy đủ: "Slot 1 · 07:30 – 09:50 (Sáng)" */
export const formatSlotLabel = (slot) =>
   slot ? `${slot.label} · ${slot.startTime} – ${slot.endTime} (${slot.period})` : '';
