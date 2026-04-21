# Hướng dẫn Triển khai Hệ thống Mini-Food trong mạng LAN (Mô hình 3 Máy)

Tài liệu này hướng dẫn cách nhóm các service để chạy trên 3 máy tính khác nhau trong mạng LAN.

## 1. Phân bổ Máy tính (Ví dụ giả định)
- **Máy 1 (192.168.1.10)**: Chạy Database (Postgres, MariaDB) và `user-service`.
- **Máy 2 (192.168.1.11)**: Chạy `food-service` và `order-service`.
- **Máy 3 (192.168.1.12)**: Chạy `payment-service` và `api-gateway`.

---

## 2. Các bước Triển khai Chi tiết

### BƯỚC 1: Triển khai Máy 1 (Database & User Service - 192.168.1.10)
Máy này đóng vai trò là trung tâm dữ liệu.
1. Mở Terminal tại thư mục gốc của project trên Máy 1.
2. Chạy lệnh để bật DB và User service:
   ```bash
   docker compose -f docker-compose.full.yml up -d postgres payment-db user-service
   ```
   *Lưu ý: user-service nằm cùng máy với postgres nên nó sẽ tự kết nối được qua tên `postgres` trong docker network.*

---

### BƯỚC 2: Triển khai Máy 2 (Food & Order Service - 192.168.1.11)
Máy này xử lý các nghiệp vụ chính về món ăn và đơn hàng.
1. Mở file `docker-compose.full.yml` trên Máy 2.
2. Tìm đến phần `environment` của 2 service này và sửa như sau:
   - **food-service**:
     ```yaml
     SPRING_DATASOURCE_URL: jdbc:postgresql://192.168.1.10:5432/food_service_db
     ```
   - **order-service**:
     ```yaml
     SPRING_DATASOURCE_URL: jdbc:postgresql://192.168.1.10:5432/order_service_db
     FOOD_SERVICE_URL: http://localhost:8082   # Vì food-service nằm cùng máy này
     USER_SERVICE_URL: http://192.168.1.10:8081
     ```
3. Chạy lệnh:
   ```bash
   docker compose -f docker-compose.full.yml up -d food-service order-service
   ```

---

### BƯỚC 3: Triển khai Máy 3 (Payment & Gateway - 192.168.1.12)
Máy này đóng vai trò thanh toán và là cửa ngõ cho người dùng.
1. Mở file `docker-compose.full.yml` trên Máy 3.
2. Sửa phần `environment`:
   - **payment-service**:
     ```yaml
     SPRING_DATASOURCE_URL: jdbc:mariadb://192.168.1.10:3306/payment
     ORDER_SERVICE_URL: http://192.168.1.11:8083
     ```
   - **api-gateway**:
     ```yaml
     USER_SERVICE_URL: http://192.168.1.10:8081
     FOOD_SERVICE_URL: http://192.168.1.11:8082
     ORDER_SERVICE_URL: http://192.168.1.11:8083
     PAYMENT_SERVICE_URL: http://localhost:8084 # Vì payment-service nằm cùng máy này
     ```
3. Chạy lệnh:
   ```bash
   docker compose -f docker-compose.full.yml up -d payment-service api-gateway
   ```

---

## 3. Tổng kết Lệnh chạy tại mỗi máy:
- **Máy 1**: `docker compose up -d postgres payment-db user-service`
- **Máy 2**: `docker compose up -d food-service order-service`
- **Máy 3**: `docker compose up -d payment-service api-gateway`

## 🛠 Lưu ý về Hot-Reload trong LAN:
- Vì bạn đang chạy qua Docker với volume mount (`- ./food-service:/app`), nếu bạn sửa code ở Máy 2, `food-service` trên Máy 2 sẽ tự reload. 
- Tuy nhiên, code giữa các máy **không tự đồng bộ**. Nếu bạn muốn code ở Máy 3 cũng cập nhật, bạn phải copy/git pull code mới sang Máy 3.

## 4. Kiểm tra
Tại **Máy 3**, bạn có thể chạy file test:
```bash
node api-gateway/test-flow.js http://localhost:8080
```
Nếu hiện `✅ All systems operational!` là bạn đã thành công dồn hệ thống vào 3 máy LAN.
