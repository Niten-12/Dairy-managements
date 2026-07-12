package com.dairy.management.controller;

import com.dairy.management.dto.AdminProductRequest;
import com.dairy.management.dto.BulkProductAvailableRequest;
import com.dairy.management.dto.BulkUserIdsRequest;
import com.dairy.management.dto.ProductResponse;
import com.dairy.management.dto.ProductStatsResponse;
import com.dairy.management.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final ProductService productService;

    /* ── List ───────────────────────────────────────────── */

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAll() {
        return ResponseEntity.ok(productService.getAllProductsForAdmin());
    }

    /* ── Stats ──────────────────────────────────────────── */

    @GetMapping("/stats")
    public ResponseEntity<ProductStatsResponse> getStats() {
        return ResponseEntity.ok(productService.getStats());
    }

    /* ── Create / Update / Delete ───────────────────────── */

    @PostMapping
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody AdminProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AdminProductRequest req) {
        return ResponseEntity.ok(productService.updateProduct(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    /* ── Toggle Availability ────────────────────────────── */

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ProductResponse> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleProductAvailable(id));
    }

    /* ── Image Upload ───────────────────────────────────── */

    @PostMapping("/{id}/image")
    public ResponseEntity<ProductResponse> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.uploadProductImage(id, file));
    }

    /* ── Bulk Operations ────────────────────────────────── */

    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDelete(
            @Valid @RequestBody BulkUserIdsRequest req) {
        int deleted = productService.bulkDeleteProducts(req.getIds());
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }

    @PostMapping("/bulk-available")
    public ResponseEntity<Map<String, Object>> bulkSetAvailable(
            @Valid @RequestBody BulkProductAvailableRequest req) {
        int updated = productService.bulkSetAvailable(req.getIds(), req.getAvailable());
        return ResponseEntity.ok(Map.of("updated", updated));
    }
}
