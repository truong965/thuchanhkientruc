# Movie Ticket Booking System - Microservices Architecture

Dự án này là hệ thống đặt vé xem phim sử dụng kiến trúc Microservices, Node.js, Prisma, RabbitMQ và Docker.

## 🚀 Hướng dẫn bắt đầu nhanh (Quick Start)

Nếu bạn vừa pull mã nguồn này về, hãy làm theo các bước sau:

### 1. Chuẩn bị Môi trường
Đảm bảo máy tính của bạn đã cài đặt:
- **Docker** và **Docker Compose**.
- Không cần cài Node.js hay Postgres local vì mọi thứ đã chạy trong Docker.

### 2. Cấu hình Biến môi trường
Mở file `.env` ở thư mục gốc.
- Nếu chạy trên **1 máy duy nhất (Localhost)**: Bạn có thể giữ nguyên các giá trị mặc định.
- Nếu chạy **Phân tán trên LAN**: Cập nhật IP của các máy vào các biến `NODE_X_IP`.

### 3. Khởi chạy Ứng dụng
Chạy lệnh sau tại thư mục gốc:
```bash
docker-compose up --build -d
```

### 4. Kiểm tra trạng thái
Đợi khoảng 1-2 phút để Database và RabbitMQ hoàn tất khởi khởi tạo. Bạn có thể xem log để chắc chắn mọi thứ đã sẵn sàng:
```bash
docker-compose logs -f
```

### 5. Truy cập
- **Frontend (Giao diện người dùng):** `http://localhost:3000`
- **API Gateway:** `http://localhost:8000`
- **RabbitMQ Management:** `http://localhost:15672` (u: user, p: password)

## 🛠 Tài liệu bổ sung
- [Hướng dẫn triển khai mạng LAN](file:///d:/HKII-2025-2026/thuchanhkientruc/tuan6_T7/LAN_DEPLOYMENT_GUIDE.md)
- [Giải thích luồng hoạt động hệ thống](file:///d:/HKII-2025-2026/thuchanhkientruc/tuan6_T7/SYSTEM_FLOW_EXPLANATION.md)

---
**Lưu ý:** Hệ thống sẽ tự động Migrate Database và Seeding dữ liệu (Phim mẫu, User mẫu) ngay khi khởi động lần đầu.
