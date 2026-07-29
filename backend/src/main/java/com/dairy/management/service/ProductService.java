package com.dairy.management.service;

import com.dairy.management.dto.AdminCategoryRequest;
import com.dairy.management.dto.AdminProductRequest;
import com.dairy.management.dto.CategoryResponse;
import com.dairy.management.dto.ProductResponse;
import com.dairy.management.dto.ProductStatsResponse;
import com.dairy.management.entity.Category;
import com.dairy.management.entity.Product;
import com.dairy.management.exception.ApiException;
import com.dairy.management.repository.CategoryRepository;
import com.dairy.management.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Sort PUBLIC_SORT =
            Sort.by("sortOrder").ascending().and(Sort.by("id").ascending());

    private static final String PRODUCT_IMAGE_DIR  = "products";
    private static final String CATEGORY_IMAGE_DIR = "categories";

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorage;

    /* ── Public: Categories ─────────────────────────── */

    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    /* ── Admin: Category CRUD ───────────────────────── */

    @Transactional
    public CategoryResponse createCategory(AdminCategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.getName().trim())) {
            throw new ApiException("Category with this name already exists", HttpStatus.CONFLICT);
        }
        Category cat = Category.builder()
                .name(req.getName().trim())
                .emoji(req.getEmoji())
                .description(req.getDescription())
                .bgColor(req.getBgColor())
                .ringColor(req.getRingColor())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .build();
        return toCategoryResponse(categoryRepository.save(cat));
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, AdminCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND));
        cat.setName(req.getName().trim());
        if (req.getEmoji()       != null) cat.setEmoji(req.getEmoji());
        if (req.getDescription() != null) cat.setDescription(req.getDescription());
        if (req.getBgColor()     != null) cat.setBgColor(req.getBgColor());
        if (req.getRingColor()   != null) cat.setRingColor(req.getRingColor());
        if (req.getSortOrder()   != null) cat.setSortOrder(req.getSortOrder());
        return toCategoryResponse(categoryRepository.save(cat));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND));
        // Products are preserved: the FK is ON DELETE SET NULL (see V3), so the
        // database uncategorises them automatically. No app-side unlink loop.
        fileStorage.deleteManaged(category.getImageUrl(), CATEGORY_IMAGE_DIR);
        categoryRepository.delete(category);
    }

    /* ── Public: Products ───────────────────────────── */

    public List<ProductResponse> getAllProducts() {
        return productRepository.findByAvailableTrue(PUBLIC_SORT)
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    public List<ProductResponse> getFeaturedProducts() {
        return productRepository.findByFeaturedTrueAndAvailableTrue(PUBLIC_SORT)
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    public List<ProductResponse> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryIdAndAvailableTrue(categoryId, PUBLIC_SORT)
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    public List<ProductResponse> searchProducts(String query) {
        return productRepository.findByNameContainingIgnoreCaseAndAvailableTrue(query, PUBLIC_SORT)
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));
        return toProductResponse(product);
    }

    /* ── Admin: All Products (incl. unavailable) ────── */

    public List<ProductResponse> getAllProductsForAdmin() {
        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream()
                .map(this::toProductResponse)
                .toList();
    }

    /* ── Admin: Create ──────────────────────────────── */

    @Transactional
    public ProductResponse createProduct(AdminProductRequest req) {
        String name = normalizedName(req);
        validatePricing(req);
        requireUniqueName(name, null);
        Category category = resolveCategory(req.getCategoryId());

        Product product = new Product();
        applyRequest(product, req, name, category);
        return toProductResponse(productRepository.save(product));
    }

    /* ── Admin: Update ──────────────────────────────── */

    /**
     * Full-replacement update (PUT semantics): every field on the resource is
     * set from the request, symmetric with create. Null optional booleans/ints
     * fall back to the same defaults as create, so the contract is
     * "send the complete product". Only the product with {@code id} is touched;
     * a missing id is a 404 and never creates or mutates another row.
     */
    @Transactional
    public ProductResponse updateProduct(Long id, AdminProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));

        String name = normalizedName(req);
        validatePricing(req);
        requireUniqueName(name, id);
        Category category = resolveCategory(req.getCategoryId());

        applyRequest(product, req, name, category);
        return toProductResponse(productRepository.save(product));
    }

    /* ── Product write helpers ──────────────────────── */

    /** Copy a validated request onto an entity. Used by both create and update. */
    private void applyRequest(Product p, AdminProductRequest req, String name, Category category) {
        p.setName(name);
        p.setDescription(normalizeBlank(req.getDescription()));
        p.setPrice(req.getPrice());
        p.setOriginalPrice(req.getOriginalPrice());
        p.setUnit(req.getUnit().trim());
        p.setEmoji(normalizeBlank(req.getEmoji()));
        p.setTag(normalizeBlank(req.getTag()));
        p.setTagType(normalizeBlank(req.getTagType()));
        p.setBgGradient(normalizeBlank(req.getBgGradient()));
        p.setAvailable(req.getAvailable() != null ? req.getAvailable() : true);
        p.setStock(req.getStock() != null ? req.getStock() : 100);
        p.setFeatured(req.getFeatured() != null ? req.getFeatured() : false);
        p.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        p.setCategory(category);
    }

    private String normalizedName(AdminProductRequest req) {
        // @NotBlank already rejected null/blank; trim so " Milk " and "Milk" collide.
        return req.getName().trim();
    }

    /** Backstop for cross-field money rules the DTO annotations cannot express. */
    private void validatePricing(AdminProductRequest req) {
        BigDecimal price = req.getPrice();
        if (price == null || price.signum() <= 0) {
            throw new ApiException("Price must be greater than zero", HttpStatus.BAD_REQUEST);
        }
        BigDecimal original = req.getOriginalPrice();
        if (original != null) {
            if (original.signum() <= 0) {
                throw new ApiException("Original price must be greater than zero", HttpStatus.BAD_REQUEST);
            }
            if (original.compareTo(price) < 0) {
                throw new ApiException("Original price cannot be lower than the price", HttpStatus.BAD_REQUEST);
            }
        }
    }

    /** Case-insensitive name uniqueness. excludeId lets a product keep its own name on update. */
    private void requireUniqueName(String name, Long excludeId) {
        productRepository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(excludeId))
                .ifPresent(existing -> {
                    throw new ApiException("A product with this name already exists", HttpStatus.CONFLICT);
                });
    }

    private static String normalizeBlank(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /* ── Admin: Delete ──────────────────────────────── */

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));
        String imageUrl = product.getImageUrl();
        productRepository.delete(product);
        // Remove the managed image only after the row is gone.
        fileStorage.deleteManaged(imageUrl, PRODUCT_IMAGE_DIR);
    }

    /* ── Admin: Toggle Available ────────────────────── */

    @Transactional
    public ProductResponse toggleProductAvailable(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));
        product.setAvailable(!product.isAvailable());
        return toProductResponse(productRepository.save(product));
    }

    /* ── Admin: Image Upload ────────────────────────────── */

    /**
     * Safe image replacement. Ordering guarantees a failed upload never destroys
     * the current working image:
     *   1. validate + store the NEW file (throws → old image untouched)
     *   2. point the entity at the new URL and flush the DB write
     *   3. if the flush fails, delete the freshly stored orphan and rethrow
     *   4. only after the DB write succeeds, delete the OLD file
     *
     * Trade-off: filesystem and PostgreSQL are not one transaction. We flush
     * (not just save) so DB errors surface inside step 3; the only residual gap
     * is a commit-time failure after a successful flush, which is rare and, at
     * worst, orphans a file — never corrupts the product row. Two-phase commit
     * is deliberately avoided.
     */
    @Transactional
    public ProductResponse uploadProductImage(Long id, MultipartFile file) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));

        String oldUrl = product.getImageUrl();
        String newUrl = fileStorage.store(file, PRODUCT_IMAGE_DIR, "product_" + id);

        product.setImageUrl(newUrl);
        Product saved;
        try {
            saved = productRepository.saveAndFlush(product);
        } catch (RuntimeException e) {
            fileStorage.deleteManaged(newUrl, PRODUCT_IMAGE_DIR); // clean up the orphan
            throw e;
        }

        fileStorage.deleteManaged(oldUrl, PRODUCT_IMAGE_DIR);
        return toProductResponse(saved);
    }

    /* ── Admin: Stats ───────────────────────────────────── */

    public ProductStatsResponse getStats() {
        List<Product> all = productRepository.findAll();
        long total      = all.size();
        long active     = all.stream().filter(Product::isAvailable).count();
        long featured   = all.stream().filter(Product::isFeatured).count();
        long lowStock   = all.stream().filter(p -> p.getStock() > 0 && p.getStock() <= 10).count();
        long outOfStock = all.stream().filter(p -> p.getStock() == 0).count();
        long cats       = categoryRepository.count();
        return ProductStatsResponse.builder()
                .total(total).active(active).inactive(total - active)
                .featured(featured).lowStock(lowStock).outOfStock(outOfStock)
                .categories(cats).build();
    }

    /* ── Admin: Bulk Delete ─────────────────────────────── */

    @Transactional
    public int bulkDeleteProducts(List<Long> ids) {
        int deleted = 0;
        for (Long id : ids) {
            if (id == null) continue;
            if (productRepository.existsById(id)) {
                productRepository.deleteById(id);
                deleted++;
            }
        }
        return deleted;
    }

    /* ── Admin: Bulk Set Available ──────────────────────── */

    @Transactional
    public int bulkSetAvailable(List<Long> ids, boolean available) {
        int updated = 0;
        for (Long id : ids) {
            if (id == null) continue;
            var opt = productRepository.findById(id);
            if (opt.isPresent()) {
                Product p = opt.get();
                if (p.isAvailable() != available) {
                    p.setAvailable(available);
                    productRepository.save(p);
                    updated++;
                }
            }
        }
        return updated;
    }

    /* ── Helpers ─────────────────────────────────────── */

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND));
    }

    private ProductResponse toProductResponse(Product p) {
        Category cat = p.getCategory();
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .unit(p.getUnit())
                .emoji(p.getEmoji())
                .tag(p.getTag())
                .tagType(p.getTagType())
                .bgGradient(p.getBgGradient())
                .available(p.isAvailable())
                .stock(p.getStock())
                .featured(p.isFeatured())
                .sortOrder(p.getSortOrder())
                .originalPrice(p.getOriginalPrice())
                .imageUrl(p.getImageUrl())
                .categoryId(cat != null ? cat.getId() : null)
                .categoryName(cat != null ? cat.getName() : null)
                .categoryEmoji(cat != null ? cat.getEmoji() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private CategoryResponse toCategoryResponse(Category c) {
        long count = c.getProducts() != null ? c.getProducts().stream().filter(Product::isAvailable).count() : 0;
        return CategoryResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .emoji(c.getEmoji())
                .description(c.getDescription())
                .bgColor(c.getBgColor())
                .ringColor(c.getRingColor())
                .sortOrder(c.getSortOrder())
                .imageUrl(c.getImageUrl())
                .productCount(count)
                .build();
    }

    /* ── Admin: Category Image Upload ───────────────────── */

    @Transactional
    public CategoryResponse uploadCategoryImage(Long id, MultipartFile file) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND));

        String oldUrl = category.getImageUrl();
        String newUrl = fileStorage.store(file, CATEGORY_IMAGE_DIR, "category_" + id);

        category.setImageUrl(newUrl);
        Category saved;
        try {
            saved = categoryRepository.saveAndFlush(category);
        } catch (RuntimeException e) {
            fileStorage.deleteManaged(newUrl, CATEGORY_IMAGE_DIR);
            throw e;
        }

        fileStorage.deleteManaged(oldUrl, CATEGORY_IMAGE_DIR);
        return toCategoryResponse(saved);
    }
}
