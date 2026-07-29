package com.dairy.management.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AdminProductRequest — Bean Validation")
class AdminProductRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll static void init() { factory = Validation.buildDefaultValidatorFactory(); validator = factory.getValidator(); }
    @AfterAll  static void close() { factory.close(); }

    private AdminProductRequest.AdminProductRequestBuilder valid() {
        return AdminProductRequest.builder()
                .name("Milk").price(new BigDecimal("28.00")).unit("500 ml").tagType("success");
    }

    private Set<String> fieldsInError(AdminProductRequest req) {
        return validator.validate(req).stream()
                .map(v -> v.getPropertyPath().toString())
                .collect(Collectors.toSet());
    }

    @Test @DisplayName("a well-formed request has no violations")
    void validPasses() {
        assertThat(fieldsInError(valid().build())).isEmpty();
    }

    @Test @DisplayName("null price is rejected")
    void nullPrice() {
        assertThat(fieldsInError(valid().price(null).build())).contains("price");
    }

    @Test @DisplayName("zero price is rejected")
    void zeroPrice() {
        assertThat(fieldsInError(valid().price(BigDecimal.ZERO).build())).contains("price");
    }

    @Test @DisplayName("negative price is rejected")
    void negativePrice() {
        assertThat(fieldsInError(valid().price(new BigDecimal("-1")).build())).contains("price");
    }

    @Test @DisplayName("price with 3 decimals is rejected (scale)")
    void priceScale() {
        assertThat(fieldsInError(valid().price(new BigDecimal("1.234")).build())).contains("price");
    }

    @Test @DisplayName("negative stock is rejected")
    void negativeStock() {
        assertThat(fieldsInError(valid().stock(-1).build())).contains("stock");
    }

    @Test @DisplayName("negative sortOrder is rejected")
    void negativeSortOrder() {
        assertThat(fieldsInError(valid().sortOrder(-1).build())).contains("sortOrder");
    }

    @Test @DisplayName("blank name is rejected")
    void blankName() {
        assertThat(fieldsInError(valid().name("   ").build())).contains("name");
    }

    @Test @DisplayName("blank unit is rejected")
    void blankUnit() {
        assertThat(fieldsInError(valid().unit("").build())).contains("unit");
    }

    @Test @DisplayName("invalid tagType is rejected")
    void invalidTagType() {
        assertThat(fieldsInError(valid().tagType("best").build())).contains("tagType");
    }

    @Test @DisplayName("null and empty tagType are both allowed")
    void nullOrEmptyTagType() {
        assertThat(fieldsInError(valid().tagType(null).build())).isEmpty();
        assertThat(fieldsInError(valid().tagType("").build())).isEmpty();
    }

    @Test @DisplayName("originalPrice of zero is rejected (field-level)")
    void zeroOriginalPrice() {
        assertThat(fieldsInError(valid().originalPrice(BigDecimal.ZERO).build())).contains("originalPrice");
    }
}
