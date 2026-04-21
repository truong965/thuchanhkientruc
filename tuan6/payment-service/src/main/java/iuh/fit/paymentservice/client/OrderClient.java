package iuh.fit.paymentservice.client;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class OrderClient {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${order.service.url}")
    private String orderServiceUrl;

    public void updateOrderStatus(Long orderId, String status) {
        String url = orderServiceUrl + "/orders/" + orderId + "/status";
        HttpEntity<Map<String, String>> entity = new HttpEntity<>(
                Map.of("status", status),
                new HttpHeaders());
        restTemplate.exchange(url, HttpMethod.PATCH, entity, Void.class);
    }
}

