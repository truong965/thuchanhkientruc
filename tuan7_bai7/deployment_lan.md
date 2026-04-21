# Hướng dẫn triển khai hệ thống Flash Sale qua mạng LAN (Đa máy chủ)

Tài liệu này hướng dẫn cách chia tách hệ thống để chạy trên nhiều máy vật lý khác nhau trong cùng mạng nội bộ.

## 1. Kịch bản triển khai (Distributed Scenario)

Giả sử bạn có 2 máy tính:
- **Máy A (192.168.1.10):** Chạy hạ tầng (Database, Redis, RabbitMQ).
- **Máy B (192.168.1.11):** Chạy các Microservices và Frontend.

---

## 2. Cấu hình trên từng máy

### Tại Máy A (Hạ tầng)
Bạn chỉ cần chạy các dịch vụ lưu trữ.
1. Mở file `docker-compose.yml`, tìm các service: `postgres`, `redis`, `rabbitmq`.
2. Chạy lệnh:
   ```bash
   docker compose up -d postgres redis rabbitmq
   ```

### Tại Máy B (Dịch vụ & Giao diện)
Máy này cần kết nối tới Máy A. 
1. Mở file `.env` tại thư mục gốc và cấu hình như sau:

```env
# IP của Máy B (máy đang chạy services) để Frontend gọi tới
LAN_IP=192.168.1.11

# IP của Máy A (nơi đặt Database/Redis/RabbitMQ)
DB_HOST=192.168.1.10
REDIS_HOST=192.168.1.10
RABBITMQ_HOST=192.168.1.10

# Endpoint nội bộ để Service gọi nhau (vẫn dùng tên container nếu cùng máy B)
INVENTORY_SERVICE_INTERNAL_URL=http://inventory-service:8084
```

2. Khởi động các services (trừ hạ tầng đã có ở máy A):
   ```bash
   # Build lại để nhận IP mới cho Frontend
   docker compose up -d --build product-service cart-service order-service inventory-service data-pump frontend
   ```

---

## 3. Lưu ý cực kỳ quan trọng về File .env

> [!CAUTION]
> **Xóa hoặc đổi tên tất cả các file .env con!**
> Trong các thư mục như `cart-service/.env`, `data-pump/.env`... thường chứa cấu hình `localhost`. 
> Nếu các file này tồn tại, chúng sẽ **ghi đè** cấu hình từ file `.env` gốc và gây lỗi kết nối.
>
> **Hành động:** Hãy đổi tên chúng thành `.env.example` để chỉ dùng làm tham khảo.

## 4. Xử lý lỗi kết nối
Nếu Máy B không thể kết nối tới Máy A:
1. **Ping:** Kiểm tra xem 2 máy có thấy nhau không (`ping 192.168.1.10`).
2. **Firewall:** Tắt Firewall hoặc mở các cổng 5432 (Postgres), 6379 (Redis), 5672 (RabbitMQ) trên **Máy A**.
3. **Docker Network:** Khi tách máy, `docker-compose.yml` sẽ sử dụng IP thật thay vì tên service Docker. Đảm bảo bạn đã điền đúng IP vào file `.env`.
