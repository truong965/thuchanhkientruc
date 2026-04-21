package iuh.fit.paymentservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        // HttpComponentsClientHttpRequestFactory cần Apache HttpClient 5
        // để RestTemplate hỗ trợ HTTP PATCH method
        return new RestTemplate(new HttpComponentsClientHttpRequestFactory());
    }
}