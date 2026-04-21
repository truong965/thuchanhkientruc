# Hướng dẫn cho người mới (Newcomer Onboarding)

Dưới đây là các bước để bạn chạy nhanh dự án Flash Sale trên máy cục bộ bằng Docker. 

## 1. Yêu cầu hệ thống
- **Docker & Docker Desktop** (v20+)
- **Node.js** (v20+)
- **Git**

## 2. Các bước thiết lập nhanh

### Bước 1: Clone code
```bash
git clone <url_cua_repostory>
cd tuan7_bai7
```

### Bước 2: Cấu hình .env (Nguồn dữ liệu duy nhất)
Dự án sử dụng file `.env` ở thư mục gốc để quản lý toàn bộ kết nối. 
- Mở file `.env` và đảm bảo `LAN_IP` đang trỏ về `localhost` (nếu chạy 1 máy) hoặc IP LAN của bạn.
- **Lưu ý quan trọng:** Không cần sửa các file `.env` nằm trong từng thư mục service. Hệ thống sẽ tự động bốc dữ liệu từ file `.env` gốc để truyền vào container.

### Bước 3: Khởi động Docker
```bash
# Khởi động toàn bộ dịch vụ
docker compose up -d
```

### Bước 4: Kiểm chứng
- **Giao diện:** `http://localhost:3000`
- **Danh sách sản phẩm:** `http://localhost:8081/products`
- **Quản lý RabbitMQ:** `http://localhost:15672` (admin/adminpassword)

## 3. Cấu trúc và Luồng dữ liệu
1. **Frontend (Port 3000):** Gọi API tới các Microservices.
2. **Infrastructure:** PostgreSQL (DB), Redis (Cache/Inventory), RabbitMQ (Message Queue).
3. **Services (Port 8081-8084):** Xử lý logic nghiệp vụ.
4. **Data Pump:** Worker ngầm đồng bộ dữ liệu từ Queue vào DB.

## 4. Nếu bạn muốn chạy Đa máy chủ (LAN)
Hãy đọc tài liệu hướng dẫn chi tiết tại: [deployment_lan.md](./deployment_lan.md) để biết cách tách máy Hạ tầng và máy Ứng dụng.
