# Hướng dẫn Triển khai Movie Ticket System qua mạng LAN

Tài liệu này hướng dẫn cách cấu hình để triển khai ứng dụng trên mạng nội bộ, bao gồm cả kịch bản Chạy tập trung (1 máy) và Chạy phân tán (3 máy).

## KIẾN TRÚC PHÂN TÁN (3 MÁY TÍNH)

Đây là cách làm chuyên nghiệp nhất, giúp hệ thống tận dụng tài nguyên của nhiều máy và mô phỏng môi trường thực tế.

### 1. Sơ đồ IP (Ví dụ)
- **Node A (192.168.1.81):** Chứa Database, RabbitMQ, Gateway, User Service, Frontend.
- **Node B (192.168.1.82):** Chứa Movie Service, Booking Service.
- **Node C (192.168.1.83):** Chứa Payment Service.

### 2. Cấu hình Biến môi trường
Trên **CẢ 3 MÁY**, bạn cần copy toàn bộ mã nguồn và đồng bộ file `.env` như sau:

```bash
# File .env (Ví dụ cho IP của 3 máy)
NODE_A_IP=192.168.1.81
NODE_B_IP=192.168.1.82
NODE_C_IP=192.168.1.83

# Các chuỗi kết nối sẽ tự động trỏ về Node A (Nơi có DB và RabbitMQ)
DATABASE_URL_USER=postgresql://root:rootpassword@${NODE_A_IP}:5432/userdb
AMQP_URL=amqp://user:password@${NODE_A_IP}:5672
```

### 3. Thực hiện triển khai (Lệnh chạy)

Tại thư mục gốc của từng máy, hãy chạy lệnh tương ứng:

#### Tại Máy 1 (Node A):
```bash
docker-compose -f docker-compose.nodeA.yml up --build -d
```
*Lưu ý: Bạn nên chạy máy 1 trước để Database và RabbitMQ sẵn sàng.*

#### Tại Máy 2 (Node B):
```bash
docker-compose -f docker-compose.nodeB.yml up --build -d
```

#### Tại Máy 3 (Node C):
```bash
docker-compose -f docker-compose.nodeC.yml up --build -d
```

## CÁC LƯU Ý QUAN TRỌNG

### 1. Windows Firewall
Máy 1 (Node A) đóng vai trò là "Server Trung tâm". Bạn **BẮT BUỘC** phải mở các Port sau trên máy 1 để máy 2 và 3 có thể kết nối vào:
- `5432` (Postgres)
- `5672` (RabbitMQ)
- `8000` (API Gateway)
- `3000` (Frontend)

### 2. Dữ liệu (Database)
Vì mã nguồn được copy sang 3 máy, nhưng chỉ có máy 1 chạy Postgres, nên máy 2 và 3 không cần cài Postgres, chúng sẽ kết nối qua mạng LAN tới máy 1. Điều này đảm bảo dữ liệu luôn đồng nhất.

### 3. Cách truy cập Giao diện
Máy khách (Client) chỉ cần truy cập vào IP của **Máy 1**:
`http://192.168.1.81:3000`

---
> [!TIP]
> Nếu bạn thay đổi IP của các máy, chỉ cần cập nhật lại 3 biến `NODE_X_IP` trong file `.env` trên cả 3 máy và khởi động lại các container.
