package iuh.fit.paymentservice.service;

import iuh.fit.paymentservice.client.OrderClient;
import iuh.fit.paymentservice.dto.PaymentRequest;
import iuh.fit.paymentservice.dto.PaymentResponse;
import iuh.fit.paymentservice.model.Payment;
import iuh.fit.paymentservice.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    @Autowired
    private OrderClient orderClient;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PaymentRepository paymentRepository;

    public PaymentResponse process(PaymentRequest request) {

        boolean success;

        if ("COD".equalsIgnoreCase(request.getMethod())) {
            success = true;
        } else {
            // giả lập banking
            success = Math.random() > 0.1;
        }

        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setUserId(request.getUserId());
        payment.setMethod(request.getMethod());


        if (!success) {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            return new PaymentResponse("FAILED", "Payment failed");
        }

        payment.setStatus("SUCCESS");
        paymentRepository.save(payment);

        // gọi Order Service
        orderClient.updateOrderStatus(request.getOrderId(), "PAID");

        // notification
        notificationService.send(
                "User " + request.getUserId() +
                        " đã đặt đơn #" + request.getOrderId() + " thành công"
        );

        return new PaymentResponse("SUCCESS", "Payment success");
    }
}
