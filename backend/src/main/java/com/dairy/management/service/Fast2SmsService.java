package com.dairy.management.service;

import com.dairy.management.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
@Slf4j
public class Fast2SmsService implements SmsService {

    @Value("${fast2sms.api-key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public void sendOtp(String phone, String code) {
        try {
            String url = "https://www.fast2sms.com/dev/bulkV2"
                    + "?authorization=" + apiKey
                    + "&variables_values=" + code
                    + "&route=otp"
                    + "&numbers=" + phone;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("cache-control", "no-cache")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Fast2SMS [{}] → {}", phone, response.body());

            if (!response.body().contains("\"return\":true")) {
                log.error("Fast2SMS failed for {}: {}", phone, response.body());
                throw new ApiException("Failed to send OTP. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
            }

        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Fast2SMS error for {}: {}", phone, e.getMessage());
            throw new ApiException("Failed to send OTP. Please try again.", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}
