package iuh.fit.se.client;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class UserServiceClient {

    private final RestTemplate restTemplate;

    @Value("${user.service.url}")
    private String userServiceUrl;

    // Gọi với token lấy từ login
    public UserInfo getUserById(String userId, String token) {
        String url = userServiceUrl + "/users/" + userId;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + token);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<UserInfo> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, UserInfo.class);
            return response.getBody();
        } catch (Exception e) {
            System.out.println("⚠️ User Service không phản hồi, dùng fallback. Lỗi: " + e.getMessage());
            UserInfo fallback = new UserInfo();
            fallback.setId(userId);
            fallback.setUsername("User_" + userId);
            return fallback;
        }
    }

    @Data
    public static class UserInfo {
        private String id;       // UUID dạng String
        private String username;
        private String role;
        private String createdAt;
    }
}