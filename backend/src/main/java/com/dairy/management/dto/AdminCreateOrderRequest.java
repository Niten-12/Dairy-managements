package com.dairy.management.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCreateOrderRequest {

    @NotNull
    private Long customerId;

    @NotBlank
    private String deliveryName;

    @NotBlank
    private String deliveryPhone;

    @NotBlank
    private String deliveryAddress;

    private String deliveryCity;
    private String deliveryPincode;
    private String notes;
    private String paymentMethod;

    @Valid
    @NotEmpty
    private List<OrderItemRequest> items;
}
