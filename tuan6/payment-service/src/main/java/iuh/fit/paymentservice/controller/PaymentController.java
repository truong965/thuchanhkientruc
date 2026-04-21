package iuh.fit.paymentservice.controller;

import iuh.fit.paymentservice.dto.PaymentRequest;
import iuh.fit.paymentservice.dto.PaymentResponse;
import iuh.fit.paymentservice.service.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@Slf4j
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public PaymentResponse pay(@RequestBody PaymentRequest request) {
        log.info("Received payment request for order: {} with method: {}", request.getOrderId(), request.getMethod());
        return paymentService.process(request);
    }
}

