Strategy Pattern cho phép định nghĩa một tập hợp các thuật toán (ở đây là các công thức tính thuế), đóng gói từng thuật toán vào một class riêng biệt và làm cho chúng có thể hoán đổi cho nhau một cách linh hoạt.

Ưu điểm của State Pattern

Đóng gói thuật toán tính toán: Mỗi loại thuế có một công thức riêng.

VATStrategy: Tính 10% trên giá gốc.

LuxuryTaxStrategy: Tính 30% trên giá gốc + phí phụ thu.

StandardTaxStrategy: Tính 5%.
Thay vì nhét tất cả các công thức này vào class Product hay Order, ta tách chúng ra thành các class chiến lược (Strategy) riêng biệt.

Loại bỏ khối lệnh if/else khổng lồ
Với Strategy, class tính tiền chỉ cần gọi hàm calculateTax(price) từ Interface chung, hệ thống sẽ tự động chạy đúng công thức của loại thuế được gán cho sản phẩm đó.

Open/Closed Principle: Ngày mai, nếu nhà nước ban hành thêm "Thuế bảo vệ môi trường", thì không cần chạm vào code cũ hay sửa class Product.Chỉ cần tạo thêm một class EcoTaxStrategy mới. Code cực kỳ an toàn và dễ bảo trì.