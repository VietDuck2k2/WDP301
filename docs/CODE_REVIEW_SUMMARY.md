# Tóm tắt kết quả Review Source Code

Mục tiêu: Kiểm tra toàn diện sự đồng bộ giữa Backend API và các tính năng Frontend UI.

## 1. Danh sách kiểm tra tính năng

| Nhóm tính năng | Backend API (Sẵn sàng) | Frontend UI (Sẵn sàng) | API Service (Đã khớp) | Trạng thái |
| :--- | :---: | :---: | :---: | :--- |
| **Xác thực (Auth)** | ✅ | ✅ | ✅ | Hoàn tất |
| **Hồ sơ cá nhân** | ✅ | ✅ | ✅ | Hoàn tất |
| **Quản lý người dùng** | ✅ | ✅ | ✅ | Hoàn tất |
| **Quản lý lớp học** | ✅ | ✅ | ✅ | Hoàn tất |
| **Thời khóa biểu (Admin)** | ✅ | ✅ | ✅ | Hoàn tất |
| **Thời khóa biểu (GV/HS)** | ✅ | ✅ | ✅ | Hoàn tất |
| **Điểm danh (Admin)** | ✅ | ✅ | ✅ | Hoàn tất |
| **Điểm danh (Giáo viên)** | ✅ | ✅ | ✅ | Hoàn tất |
| **Bài tập** | ✅ | ✅ | ✅ | Hoàn tất |
| **Nộp bài (Học sinh)** | ✅ | ✅ | ✅ | Hoàn tất |
| **Báo cáo & Thống kê** | ✅ | ✅ | ✅ | Hoàn tất |
| **Thông báo** | ✅ | ✅ | ✅ | Hoàn tất |
| **Tải lên tệp tin** | ✅ | ✅ | ✅ | Hoàn tất |

## 2. Các điểm bất thường và Quan sát

### i. Thiếu phương thức trong API Service
- **Admin Dashboard**: `Dashboard.jsx` đang gọi trực tiếp `/admin/dashboard/stats` qua `axiosInstance`. Nên chuyển vào `adminApi.js` để đảm bảo tính nhất quán.
- **Dữ liệu Master**: `Timetable.jsx` có một số lời gọi API lẻ tẻ để lấy dữ liệu cho dropdown (Lớp, Giáo viên). Mặc dù hoạt động tốt nhưng có thể tối ưu lại để code sạch hơn.

### ii. Ngôn ngữ không đồng nhất
- **Trộn lẫn ngôn ngữ**: Các trang như `Admin Users` và `Dashboard` đang dùng **tiếng Anh**, trong khi `Teacher Attendance` và `Student Assignments` dùng **tiếng Việt**.
- **Hành động**: Khuyến nghị thống nhất toàn bộ giao diện sang tiếng Việt để phù hợp với ngữ cảnh sử dụng.

### iii. Code thừa / Trùng lặp
- `authApi.js` đang được định nghĩa 2 lần (một lần ở file riêng và một lần bên trong `timetableApi.js`).
- **Hành động**: Xóa định nghĩa dư thừa trong `timetableApi.js`.

## 3. Kết luận
Hệ thống đã đồng bộ khoảng **95%**. Các chức năng cốt lõi cho cả 3 vai trò (Admin, Giáo viên, Học sinh) đều đã sẵn sàng. Không có lỗ hổng nghiêm trọng nào (tính năng UI mà không có API hoặc ngược lại).

Bước tiếp theo khuyến nghị: **Thống nhất ngôn ngữ và chuyển các lời gọi axios trực tiếp vào các file API service.**
