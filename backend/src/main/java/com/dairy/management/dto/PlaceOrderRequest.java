package com.dairy.management.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaceOrderRequest {

    @NotBlank
    private String deliveryName;

    @NotBlank
    private String deliveryPhone;

    @NotBlank
    private String deliveryAddress;

    private String deliveryCity;
    private String deliveryPincode;
    private String notes;

    @Valid
    @NotEmpty
    private List<OrderItemRequest> items;
}
