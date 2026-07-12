package com.dairy.management.controller;

import com.dairy.management.dto.AdminCreateOrderRequest;
import com.dairy.management.dto.AdminOrderStatusRequest;
import com.dairy.management.dto.OrderResponse;
import com.dairy.management.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody AdminCreateOrderRequest req
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrderAdmin(req));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAll(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(orderService.getAllOrdersAdmin(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderByIdAdmin(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminOrderStatusRequest req
    ) {
        return ResponseEntity.ok(orderService.adminUpdateOrderStatus(id, req.getStatus()));
    }
}
