package com.dairy.management.dto;

import com.dairy.management.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AdminOrderStatusRequest {

    @NotNull
    private OrderStatus status;
}
