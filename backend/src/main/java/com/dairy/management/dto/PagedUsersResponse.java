package com.dairy.management.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PagedUsersResponse {
    private List<UserSummaryResponse> content;
    private int  page;
    private int  size;
    private long total;
    private int  totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
}
