package com.dairy.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir + "/")
                // Uploaded images are immutable by construction: FileStorageService
                // names every file "<prefix>_<uuid>.<ext>", and replacing an image
                // deletes the old file and issues a brand-new URL. The bytes behind a
                // given /uploads/** URL therefore never change, so clients can hold
                // them for a year and skip the request entirely.
                //
                // This is the difference between every visitor re-downloading the
                // whole catalogue on every visit and downloading it once — the
                // dominant egress cost on a hosted deployment, where bandwidth is
                // billed per GB.
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS)
                        .cachePublic()
                        .immutable());
    }
}
