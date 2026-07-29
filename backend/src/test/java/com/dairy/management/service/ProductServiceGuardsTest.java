package com.dairy.management.service;

import com.dairy.management.dto.AdminProductRequest;
import com.dairy.management.dto.ProductResponse;
import com.dairy.management.entity.Category;
import com.dairy.management.entity.Product;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.CategoryRepository;
import com.dairy.management.repository.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService — write guards & update integrity")
class ProductServiceGuardsTest {

    @Mock ProductRepository productRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock FileStorageService fileStorage;

    @InjectMocks ProductService service;

    private AdminProductRequest validReq(String name) {
        return AdminProductRequest.builder()
                .name(name).price(new BigDecimal("28.00")).unit("500 ml")
                .build();
    }

    private ApiException thrownBy(Runnable r) {
        try { r.run(); } catch (ApiException e) { return e; }
        throw new AssertionError("expected ApiException");
    }

    /* ── pricing guards ──────────────────────────────────────────────────── */

    @Test @DisplayName("zero price is rejected 400")
    void zeroPrice() {
        AdminProductRequest req = validReq("Milk");
        req.setPrice(BigDecimal.ZERO);
        assertThat(thrownBy(() -> service.createProduct(req)).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(productRepository, never()).save(any());
    }

    @Test @DisplayName("negative price is rejected 400")
    void negativePrice() {
        AdminProductRequest req = validReq("Milk");
        req.setPrice(new BigDecimal("-5"));
        assertThat(thrownBy(() -> service.createProduct(req)).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test @DisplayName("originalPrice below price is rejected 400")
    void originalBelowPrice() {
        AdminProductRequest req = validReq("Milk");
        req.setPrice(new BigDecimal("30"));
        req.setOriginalPrice(new BigDecimal("25"));
        assertThat(thrownBy(() -> service.createProduct(req)).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test @DisplayName("originalPrice equal to price is allowed")
    void originalEqualsPrice() {
        AdminProductRequest req = validReq("Milk");
        req.setPrice(new BigDecimal("30"));
        req.setOriginalPrice(new BigDecimal("30"));
        when(productRepository.findByNameIgnoreCase("Milk")).thenReturn(Optional.empty());
        when(productRepository.save(any())).thenAnswer(i -> { Product p = i.getArgument(0); p.setId(5L); return p; });

        ProductResponse resp = service.createProduct(req);
        assertThat(resp.getOriginalPrice()).isEqualByComparingTo("30");
    }

    /* ── duplicate name ──────────────────────────────────────────────────── */

    @Test @DisplayName("duplicate name (case-insensitive) is rejected 409 on create")
    void duplicateNameCreate() {
        AdminProductRequest req = validReq("milk");
        Product existing = Product.builder().id(9L).name("Milk").build();
        when(productRepository.findByNameIgnoreCase("milk")).thenReturn(Optional.of(existing));

        assertThat(thrownBy(() -> service.createProduct(req)).getStatus()).isEqualTo(HttpStatus.CONFLICT);
        verify(productRepository, never()).save(any());
    }

    @Test @DisplayName("a product keeps its own name on update (no false conflict)")
    void updateKeepsOwnName() {
        Product target = Product.builder().id(1L).name("Milk").price(new BigDecimal("10")).unit("1L").build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(target));
        when(productRepository.findByNameIgnoreCase("Milk")).thenReturn(Optional.of(target)); // itself
        when(productRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ProductResponse resp = service.updateProduct(1L, validReq("Milk"));
        assertThat(resp.getId()).isEqualTo(1L);
    }

    /* ── category resolution ─────────────────────────────────────────────── */

    @Test @DisplayName("invalid category id is rejected 404, not silently nulled")
    void invalidCategory() {
        AdminProductRequest req = validReq("Milk");
        req.setCategoryId(999L);
        when(productRepository.findByNameIgnoreCase("Milk")).thenReturn(Optional.empty());
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThat(thrownBy(() -> service.createProduct(req)).getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(productRepository, never()).save(any());
    }

    /* ── update integrity ────────────────────────────────────────────────── */

    @Test @DisplayName("update targets only the requested product; a missing id is 404")
    void updateMissing() {
        when(productRepository.findById(42L)).thenReturn(Optional.empty());
        assertThat(thrownBy(() -> service.updateProduct(42L, validReq("X"))).getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(productRepository, never()).save(any());
    }

    @Test @DisplayName("update mutates the fetched entity in place (Product A only)")
    void updateMutatesOnlyTarget() {
        Product productA = Product.builder().id(1L).name("Old A").price(new BigDecimal("10")).unit("1L").build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(productA));
        when(productRepository.findByNameIgnoreCase("New A")).thenReturn(Optional.empty());
        when(productRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        AdminProductRequest req = validReq("New A");
        req.setPrice(new BigDecimal("99.50"));
        ProductResponse resp = service.updateProduct(1L, req);

        // the same entity (id 1) was updated, not a new/other one
        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getName()).isEqualTo("New A");
        assertThat(resp.getPrice()).isEqualByComparingTo("99.50");
        verify(productRepository).save(productA);
    }

    @Test @DisplayName("full-replace semantics: null optional booleans/ints get create-defaults")
    void fullReplaceDefaults() {
        Product target = Product.builder().id(1L).name("P").price(new BigDecimal("10")).unit("1L")
                .available(false).stock(3).featured(true).sortOrder(7).build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(target));
        when(productRepository.findByNameIgnoreCase("P")).thenReturn(Optional.of(target));
        when(productRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // request omits available/stock/featured/sortOrder → defaults applied
        ProductResponse resp = service.updateProduct(1L, validReq("P"));
        assertThat(resp.isAvailable()).isTrue();   // default true
        assertThat(resp.getStock()).isEqualTo(100); // default 100
        assertThat(resp.isFeatured()).isFalse();     // default false
        assertThat(resp.getSortOrder()).isZero();    // default 0
    }

    @Test @DisplayName("blank optional strings normalize to null")
    void blankStringsNormalized() {
        AdminProductRequest req = validReq("Milk");
        req.setDescription("   ");
        req.setTag("");
        when(productRepository.findByNameIgnoreCase("Milk")).thenReturn(Optional.empty());
        when(productRepository.save(any())).thenAnswer(i -> { Product p = i.getArgument(0); p.setId(1L); return p; });

        ProductResponse resp = service.createProduct(req);
        assertThat(resp.getDescription()).isNull();
        assertThat(resp.getTag()).isNull();
    }

    /* ── delete cleans image after row removal ───────────────────────────── */

    @Test @DisplayName("deleting a product removes the row then its managed image")
    void deleteCleansImage() {
        Product p = Product.builder().id(1L).name("P").imageUrl("/uploads/products/product_1_abcd1234.jpg").build();
        when(productRepository.findById(1L)).thenReturn(Optional.of(p));

        service.deleteProduct(1L);

        verify(productRepository).delete(p);
        verify(fileStorage).deleteManaged("/uploads/products/product_1_abcd1234.jpg", "products");
    }
}
