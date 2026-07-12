package com.dairy.management.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BulkStatusRequest {

    @NotEmpty(message = "At least one user ID is required")
    private List<Long> ids;

    @NotNull(message = "Active status is required")
    private Boolean active;
}
