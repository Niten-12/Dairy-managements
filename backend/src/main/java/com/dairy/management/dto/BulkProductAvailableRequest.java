package com.dairy.management.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BulkProductAvailableRequest {

    @NotEmpty(message = "At least one product ID is required")
    private List<Long> ids;

    @NotNull(message = "Available flag is required")
    private Boolean available;
}
