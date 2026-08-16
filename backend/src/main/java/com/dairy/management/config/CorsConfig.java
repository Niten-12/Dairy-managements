package com.dairy.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    /**
     * Origins allowed to call the API, comma-separated, overridable per
     * environment via APP_CORS_ALLOWED_ORIGINS.
     *
     * The defaults cover both shipping clients:
     *  - http://localhost:3000 / :5173 — the web build (nginx and Vite dev).
     *  - https://localhost — the Capacitor Android APK. Its WebView serves the
     *    bundled app from this synthetic origin (capacitor.config.json sets
     *    androidScheme: "https"), so to the backend an APK request looks
     *    cross-origin and is rejected unless this is listed.
     *  - capacitor://localhost — the equivalent iOS origin, listed so an iOS
     *    build does not silently fail CORS later.
     *
     * A wildcard is deliberately NOT used: allowCredentials(true) forbids "*",
     * and the JWT flow depends on credentialed requests.
     */
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173,https://localhost,capacitor://localhost}")
    private String allowedOrigins;

    @Bean
    public CorsFilter corsFilter() {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(origins);
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        // Uploaded images are fetched by the APK from a different origin than
        // the app bundle, so they need the same CORS treatment as the API.
        source.registerCorsConfiguration("/uploads/**", config);
        return new CorsFilter(source);
    }
}
