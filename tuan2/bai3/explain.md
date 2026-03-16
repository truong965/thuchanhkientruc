Sử dụng Decorator Pattern cho hệ thống thanh toán trong bài này là hợp lý vì các chức năng bổ sung (processing fee, discount, tax…) có thể được thêm vào linh hoạt và kết hợp với nhau theo nhiều cách khác nhau.
Ưu điểm 
1.Nếu không dùng Decorator sẽ phải tạo rất nhiều class để bao phủ mọi trường hợp: CreditCardPaymentWithFee, CreditCardPaymentWithDiscount

2.Có thể kết hợp tính năng linh hoạt. Decorator cho phép bọc object nhiều lớp.

Ví dụ:

Payment payment =
   new DiscountDecorator(
       new ProcessingFeeDecorator(
           new CreditCardPayment()
       )
   );

3.Tuân thủ nguyên tắc Open/Closed Principle. sau này có thể thêm chức năng khác như CashbackDecorator, LoyaltyPointDecorator.
