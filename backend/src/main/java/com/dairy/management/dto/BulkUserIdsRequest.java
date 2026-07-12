package com.dairy.management.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkUserIdsRequest {

    @NotEmpty(message = "At least one user ID is required")
    private List<Long> ids;
}
