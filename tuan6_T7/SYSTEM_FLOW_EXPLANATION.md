# Giải thích Luồng hoạt động hệ thống (System Flow) - 3 Node Architecture

Tài liệu này chi tiết cách các dịch vụ tương tác với nhau khi được triển khai phân tán trên 3 máy tính vật lý trong mạng LAN.

## 1. Sơ đồ các Node
- **Node A (192.168.1.81):** Trung tâm điều phối (Gateway, User Service, Frontend, DB, RabbitMQ).
- **Node B (192.168.1.82):** Xử lý nghiệp vụ (Movie Service, Booking Service).
- **Node C (192.168.1.83):** Xử lý thanh toán (Payment Service).

## 2. Luồng truy cập từ người dùng (Frontend -> Gateway)

1. **Truy cập Giao diện:** Người dùng từ máy bất kỳ trong LAN mở trình duyệt và truy cập `http://192.168.1.81:3000`.
2. **Yêu cầu API:** Khi người dùng thao tác (vd: Đặt vé), Frontend gửi yêu cầu đến `/api/bookings`.
3. **Điều phối (Vite Proxy):** Frontend nhận yêu cầu từ trình duyệt. Dựa trên cấu hình `proxy`, nó chuyển tiếp yêu cầu này đến **API Gateway** thông qua tên định danh nội bộ Docker `http://api-gateway:8000`. (Vì Frontend và Gateway cùng nằm trong Node A nên chúng liên lạc rất nhanh qua mạng ảo nội bộ).
4. **Định tuyến LAN (Gateway Routing):**
   - API Gateway mở cổng **8000** ra toàn mạng LAN (0.0.0.0).
   - Gateway tra cứu cấu hình `.env` để biết `Booking Service` đang nằm ở IP LAN của Máy 2 (`192.168.1.82`).
   - Gateway thực hiện một cuộc gọi **HTTP LAN** (xuyên máy) từ Node A sang Node B.

## 3. Luồng nghiệp vụ liên kết (Inter-service Communication)

### Tương tác Đồng bộ (Synchronous)
Khi `Booking Service` (Node B) cần kiểm tra số ghế của một bộ phim:
- Nó thực hiện gọi trực tiếp đến `Movie Service` (cùng nằm tại Node B).
- Việc này diễn ra cực nhanh vì diễn ra trong nội bộ máy Node B.

### Tương tác Bất đồng bộ (Event-Driven)
Đây là cách các máy "nói chuyện" với nhau mà không cần chờ đợi:
1. **Phát sự kiện:** Sau khi tạo đơn, `Booking Service` (Node B) gửi thông điệp `BOOKING_CREATED` tới **RabbitMQ** (đang nằm ở Node A).
2. **Nhận sự kiện:** `Payment Service` (Node C) luôn duy trì kết nối tới RabbitMQ (Node A). Ngay khi có tin nhắn, máy 3 sẽ nhận được dữ liệu để xử lý thanh toán.
3. **Phản hồi sự kiện:** Sau khi giả lập thanh toán thành công, `Payment Service` (Node C) gửi lại sự kiện `order.payment.completed` về RabbitMQ (Node A).
4. **Cập nhật Inventory:** `Movie Service` (Node B) nhận được tin nhắn từ RabbitMQ (Node A) và thực hiện trừ số lượng ghế trong Database.

## 4. Cơ sở dữ liệu tập trung (Centralized DB)

Tất cả các dịch vụ trên cả 3 máy đều kết nối về duy nhất một thực thể **PostgreSQL** tại **Node A**:
- **Dữ liệu nhất quán:** Mọi hành động ghi ở máy 2 hay máy 3 đều được cập nhật vào máy 1.
- **Tính toàn vẹn:** Nhờ lệnh `UPDATE` nguyên tử (Atomic Update), việc nhiều người đặt vé cùng lúc từ nhiều máy khác nhau vẫn luôn đảm bảo không bị quá số lượng ghế thực tế.

---
> [!IMPORTANT]
> **Điểm mấu chốt:** API Gateway là "cửa ngõ" duy nhất mà Frontend cần biết. Việc các Backend nằm ở máy nào hoàn toàn được Gateway che giấu và điều hướng thông qua cấu hình IP trong LAN.
