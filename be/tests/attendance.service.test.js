const { verifyTeacherAttendancePermission } = require('../src/services/attendance.service');
const Session = require('../src/models/Session');
const ClassMember = require('../src/models/ClassMember');
const ApiError = require('../src/utils/apiError');

jest.mock('../src/models/Session');
jest.mock('../src/models/ClassMember');

describe('verifyTeacherAttendancePermission', () => {
   afterEach(() => {
      jest.clearAllMocks();
   });

   it('should throw ApiError.notFound if session does not exist', async () => {
      Session.findById.mockResolvedValue(null);

      await expect(verifyTeacherAttendancePermission('invalid_id', 'teacher1'))
         .rejects.toThrow('Session not found');
   });

   it('should throw ApiError.forbidden if teacher is not assigned to the class', async () => {
      Session.findById.mockResolvedValue({ _id: 'session1', class: 'class1' });
      ClassMember.findOne.mockResolvedValue(null);

      await expect(verifyTeacherAttendancePermission('session1', 'teacher1'))
         .rejects.toThrow('Bạn không có quyền điểm danh cho lớp học này vì không phải là giáo viên của lớp.');
   });

   it('should throw ApiError.forbidden if current time is more than 24 hours after session start', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 30); // 30 hours ago

      Session.findById.mockResolvedValue({
         _id: 'session1',
         class: 'class1',
         date: pastDate,
         startTime: `${String(pastDate.getHours()).padStart(2, '0')}:${String(pastDate.getMinutes()).padStart(2, '0')}`
      });
      ClassMember.findOne.mockResolvedValue({ _id: 'member1', role: 'teacher' });

      await expect(verifyTeacherAttendancePermission('session1', 'teacher1'))
         .rejects.toThrow('Chỉ được chỉnh sửa điểm danh trong vòng 24 giờ kể từ khi buổi học bắt đầu.');
   });

   it('should throw ApiError.forbidden if current time is BEFORE session start', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // 2 hours in the future

      Session.findById.mockResolvedValue({
         _id: 'session1',
         class: 'class1',
         date: futureDate,
         startTime: `${String(futureDate.getHours()).padStart(2, '0')}:${String(futureDate.getMinutes()).padStart(2, '0')}`
      });
      ClassMember.findOne.mockResolvedValue({ _id: 'member1', role: 'teacher' });

      await expect(verifyTeacherAttendancePermission('session1', 'teacher1'))
         .rejects.toThrow('Chưa đến giờ điểm danh cho buổi học này.'); // This will fail currently, leading to TDD fix.
   });

   it('should succeed if teacher is assigned and time is within 24 hours after start time', async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 5); // 5 hours ago

      Session.findById.mockResolvedValue({
         _id: 'session1',
         class: 'class1',
         date: recentDate,
         startTime: `${String(recentDate.getHours()).padStart(2, '0')}:${String(recentDate.getMinutes()).padStart(2, '0')}`
      });
      ClassMember.findOne.mockResolvedValue({ _id: 'member1', role: 'teacher' });

      await expect(verifyTeacherAttendancePermission('session1', 'teacher1')).resolves.toBeUndefined();
   });
});
