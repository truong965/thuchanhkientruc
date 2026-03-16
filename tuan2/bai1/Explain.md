State Pattern cho phép một đối tượng Order thay đổi hành vi của nó khi trạng thái nội bộ thay đổi.  
Khi áp dụng mẫu này, đối tượng dường như thay đổi luôn cả class của nó.
---

## Luồng trạng thái của đơn hàng

Mới tạo → Đang xử lý → Đã giao
|		|
hủy            hủy


Ưu điểm của State Pattern

 1. Giảm thiểu `if/else` trong class `Order`.
 2. Dễ mở rộng hệ thống khi cần thêm trạng thái mới, ví dụ: Hoàn hàng

