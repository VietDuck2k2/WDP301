## 🎼 Orchestration Report

### Task
Phân tích logic tạo lớp & phân chia phòng học, và sửa lỗi báo trùng giờ (False Conflict) khi kéo giãn/đổi lịch ngày học của 2 lớp cùng sử dụng 1 phòng.

### Mode
edit

### Agents Invoked
| # | Agent | Focus Area | Status |
|---|-------|------------|--------|
| 1 | `project-planner` | Phân tích quy trình tạo & cập nhật lớp học | ✅ |
| 2 | `debugger` | Tìm ra nguyên nhân lỗi False Conflict khi đổi ngày | ✅ |
| 3 | `backend-specialist` | Sửa luồng dữ liệu session, tái tạo (regenerate) session khi đổi lịch, rollback session tạo lỗi | ✅ |

### Verification Scripts Executed
- [x] Tested locally via `npm run dev` in backend.
- [x] Chrome End-to-End Test (browser_subagent): Đã verify trên UI thực tế, vào trang Classes, thay đổi Class 2 sang cùng phòng A102 vào các ngày không giao nhau (11/3 - 31/3), lưu thành công và không còn bắn lỗi "False Conflict".

### Key Findings
1. **`project-planner`**: Dữ liệu lưu trong DB không có ràng buộc Unique Index liên quan đến Room + Date + Slot, mọi thứ check qua code ở Application Layer. Code cũ kiểm tra xung đột rất chặt cho lịch cố định.
2. **`debugger`**: 
    - Lỗi trùng lặp khi bạn lùi lịch Class 2 sang `11/3 -> 31/3` xuất phát từ việc **hệ thống không bao giờ tự động cập nhật ngày của các Session cũ** khi thay đổi `startDate/endDate` của Class!
    - Do các session vẫn mang Date của tháng 3 (từ ngày 1-10), nên hệ thống so sánh Room với Lớp 1 (cũng đang học ngày 1-10) và văng lỗi trùng.
3. **`backend-specialist`**:
    - Trong `session.service.js`, API generate có lỗi ngầm: nếu check trùng mà bị lỗi ở giữa luồng, nó bắn Error nhưng KHÔNG xoá (rollback) những session ở các ngày trước đó đã insert thành công.

### Deliverables
- [x] PLAN.md created (Phân tích ban đầu)
- [x] Code implemented
    - `class.controller.js`: Auto xoá các scheduled session cũ và gọi `generateSessionsFromTemplate` nếu phát hiện có sự thay đổi về `startDate`, `endDate`, hoặc `scheduleTemplate`.
    - `class.service.js` (`updateClass`): Bỏ qua check trùng Room cho các scheduled session khi Class đang cập nhật ngày chiếu vì đằng nào chúng cũng sẽ được xoá và tạo lại mới. 
    - `session.service.js` (`generateSessionsFromTemplate`): Tự động dọn dẹp (Rollback `Session.deleteMany`) tất cả các session đã được gen ra nếu quá trình loop check room conflict bị dính 1 cái trùng. Đảm bảo toàn vẹn dữ liệu.

### Summary
Hệ thống hiện tại đã xử lý được trọn vẹn luồng thay đổi Date và Room. Nếu người thay đổi lùi lịch học sang các ngày không còn bị trùng lắp phòng, hệ thống sẽ tự động dọn bỏ (delete) các khung giờ đã lên lịch sẵn ở ngày cũ và Re-generate lại khung giờ mới dựa trên Template ở các mốc thời gian mới một cách tự động và sạch sẽ. Lỗi "False Conflict" đã bị loại bỏ hoàn toàn.
