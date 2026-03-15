---
name: project-explorer
description: 'Phân tích và đọc source code để nắm bắt cấu trúc, công nghệ và luồng hoạt động của một dự án mới.'
---

# Project Explorer (Hướng dẫn Đọc Source Code)

Skill này giúp khám phá và phân tích một dự án từ đầu, tạo ra báo cáo chi tiết về kiến trúc, cấu trúc thư mục, các công nghệ được sử dụng và luồng dữ liệu (data flow) chính trong hệ thống.

## Khi nào nên sử dụng
- Khi mới tham gia vào một dự án có sẵn.
- Khi cần hiểu tổng quan về architecture, các dependencies và file entry point.
- Khi cần tìm hiểu một module hoặc component lớn nhưng chưa biết bắt đầu từ đâu.

## Quy trình Khám phá Dự án

Thực hiện các bước sau để đọc và phân tích source code:

1. **Đọc tài liệu tổng quan và cấu hình:**
   - Đọc các file `README.md`, `.env.example`, `package.json`, `pom.xml`, `requirements.txt`, hoặc `docker-compose.yml` (tùy thuộc vào ngôn ngữ).
   - Mục đích: Nắm được các công nghệ (Tech Stack), thiết lập môi trường, và các lệnh chạy dự án.

2. **Phân tích Cấu trúc Thư mục:**
   - Xem qua các thư mục ở Root và bên trong thư mục `src/` hoặc tương đương.
   - Xác định vai trò của từng thư mục (ví dụ: `controllers/`, `routes/`, `services/`, `models/`, `components/`, `pages/`).

3. **Khám phá các Entry points:**
   - Tìm và đọc các file đóng vai trò khởi chạy ứng dụng (ví dụ: `main.ts`, `app.js`, `index.jsx`, `Program.cs`, `Application.java`).
   - Tìm hiểu cách ứng dụng khởi tạo database, middleware, router, và các services bên ngoài.

4. **Theo dõi một Luồng Dữ Liệu (Data Flow) mẫu:**
   - Chọn một luồng cơ bản (ví dụ: Login auth, hoặc lấy danh sách items).
   - Truy vết từ Route -> Controller -> Service/Usecase -> Repository/Model.
   - Ghi chú lại cách dữ liệu được biến đổi và xử lý lỗi (Error Handling).

5. **Tổng hợp và Lập Báo cáo:**
   - Cung cấp cho người dùng một báo cáo tóm tắt kiến trúc của dự án.
   - Gợi ý các file quan trọng nhất người dùng nên đọc sâu hơn.

## Ví dụ sử dụng
- "Dùng project-explorer để quét thư mục be/ này và cho tôi biết kiến trúc của nó"
- "Phân tích file package.json và app.js để vẽ ra bức tranh tổng quan của backend"