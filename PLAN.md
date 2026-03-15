# Kế hoạch (Plan): Tính năng Báo nghỉ & Học bù (Cancel & Make-up)

**Mục tiêu:** Cho phép Admin huỷ một buổi học cụ thể (vì lý do nghỉ lễ/giáo viên ốm) và tạo ra một buổi học bù tương ứng mà không làm xáo trộn lịch trình của toàn bộ lớp học hay gây lỗi trùng lặp phòng.

## 1. Cập nhật Model & Schema (Database Architect)
Thực hiện thay đổi trong `be/src/models/Session.js` để hỗ trợ lưu vết lý do nghỉ và nguồn gốc của buổi học bù.

#### [MODIFY] [Session.js](file:///C:/WDP301/ENGLISH%20CENTER%20MANAGER%20SYSTEM/be/src/models/Session.js)
- Thêm thuộc tính `cancelReason` (String): Lưu lý do huỷ buổi học (ví dụ: "Nghỉ lễ 30/4", "Giáo viên báo ốm").
- Thêm thuộc tính `isMakeup` (Boolean, default: `false`): Đánh dấu đây là buổi học bù được tạo ra ngoài schedule template gốc.
- Thêm thuộc tính `makeupForSession` (ObjectId, ref: `Session`): Link buổi học bù này về đúng buổi học đã bị huỷ trước đó (giúp thống kê dễ dàng).

## 2. Nâng cấp Backend API (Backend Specialist)
Mở rộng `session.service.js` và `sessions.controller.js` hỗ trợ chuyên sâu cho 2 thao tác này thay vì dùng chung hàm `update` cơ bản.

#### [MODIFY] [session.service.js](file:///C:/WDP301/ENGLISH%20CENTER%20MANAGER%20SYSTEM/be/src/services/session.service.js)
- **Cập nhật `updateSession`:** Đảm bảo khi Status chuyển sang `cancelled`, hệ thống lưu lại `cancelReason`.
- **Tạo hàm mới `createMakeupSession`:** 
  - Nhận tham số: `originalSessionId`, `newDate`, `newSlotNumber`, `newRoom`, `teacherId`.
  - Kiểm tra xem original session đã bị huỷ chưa.
  - Kiểm tra trùng lặp phòng (`checkRoomConflict`) cho lịch bù mới.
  - Clone dữ liệu từ original session (cùng class, cùng sessionNumber hoặc title cũ) và set `isMakeup: true`, `makeupForSession: originalSessionId`.

#### [MODIFY] [session.controller.js](file:///C:/WDP301/ENGLISH%20CENTER%20MANAGER%20SYSTEM/be/src/controllers/admin/sessions.controller.js)
- Thêm route `POST /api/admin/sessions/:id/makeup` để gọi hàm `createMakeupSession`.

## 3. Nâng cấp Frontend UI (Frontend Specialist)
Sửa đổi giao diện Quản lý Lịch học (Timetable) để thao tác mượt mà nhất.

#### [MODIFY] [Timetable.jsx](file:///C:/WDP301/ENGLISH%20CENTER%20MANAGER%20SYSTEM/frontend/src/pages/Timetable.jsx)
- **Hiển thị (Rendering):** Tại bảng lịch học, nếu `status === 'cancelled'`, đổi màu nền sang đỏ/xám nhạt và hiển thị Icon/text "Đã huỷ". Nếu `isMakeup === true`, hiển thị badge "Học bù" màu cam/vàng.
- **Form Edit Session:** 
  - Khi status = `cancelled`, hiện thêm input text "Lý do huỷ" (`cancelReason`).
  - Thêm một nút mới: **"Tạo buổi học bù"** (Create Make-up Session) chỉ hiển thị khi session hiện tại đang bị `cancelled`.
- **Form Make-up:** Nút này mở ra form tạo buổi bù (cơ bản chọn Ngày, Khung giờ, Phòng học). Gửi request POST lên API makeup mới.

## Verification Plan

### Automated Tests
- Chạy npm run dev xem có lỗi linter/build nào không sau khi cập nhật model.
- (Tùy chọn) Viết script test JS test việc "cancel một buổi & tạo buổi bù".

### Manual Verification (Browser Subagent / User)
1. Đăng nhập qua Account Admin.
2. Vào màn hình Timetable (Lịch học).
3. Bấm vào một buổi học bất kỳ (ví dụ buổi số 4 của Lớp A). Đổi Status sang Cancelled, điền lý do "Nghỉ lễ". Bấm Lưu.
4. Xác nhận buổi học trên giao diện đổi màu hiển thị là Đã huỷ.
5. Bấm lại vào buổi đó, chọn nút "Tạo buổi học bù". Chọn một ngày tương lai với phòng trống.
6. Xác nhận buổi học bù hiện ra đúng ngày gắn Label "Học bù".

---

## User Review Required
> [!IMPORTANT]
> Plan đã được tạo ra theo đúng mong muốn của bạn với Flow sát thực tế nhất. Bạn có đồng ý với Kế hoạch này không (thêm API Make-up và cập nhật Timetable UI)?
> Vui lòng phản hồi Y để bắt đầu thực thi Implementation (Phase 2).
