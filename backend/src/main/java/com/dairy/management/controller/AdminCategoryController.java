package com.dairy.management.controller;

import com.dairy.management.dto.AdminCategoryRequest;
import com.dairy.management.dto.CategoryResponse;
import com.dairy.management.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Admin Category Management Controller
 *
 * @package   OpenEMR
 * @link      https://www.open-emr.org
 * @author    DairyFresh Team
 * @copyright Copyright (c) 2024 DairyFresh
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAll() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody AdminCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createCategory(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AdminCategoryRequest req
    ) {
        return ResponseEntity.ok(productService.updateCategory(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<CategoryResponse> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.uploadCategoryImage(id, file));
    }
}
