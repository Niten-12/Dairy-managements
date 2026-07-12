package com.dairy.management.controller;

import com.dairy.management.dto.OrderResponse;
import com.dairy.management.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final OrderService orderService;

    @GetMapping("/orders/pending")
    public ResponseEntity<List<OrderResponse>> getPendingDeliveries() {
        return ResponseEntity.ok(orderService.getPendingForDelivery());
    }

    @PutMapping("/orders/{id}/delivered")
    public ResponseEntity<OrderResponse> markDelivered(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.markAsDelivered(id));
    }

    @GetMapping("/orders/history")
    public ResponseEntity<List<OrderResponse>> getDeliveryHistory() {
        return ResponseEntity.ok(orderService.getDeliveryHistory());
    }
}
