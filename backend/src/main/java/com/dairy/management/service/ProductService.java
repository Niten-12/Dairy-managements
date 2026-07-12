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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Sort PUBLIC_SORT =
            Sort.by("sortOrder").ascending().and(Sort.by("id").ascending());

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

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
        if (!categoryRepository.existsById(id)) {
            throw new ApiException("Category not found", HttpStatus.NOT_FOUND);
        }
        // unlink products from this category before deleting
        productRepository.findAll().stream()
                .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(id))
                .forEach(p -> { p.setCategory(null); productRepository.save(p); });
        categoryRepository.deleteById(id);
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
        Category category = resolveCategory(req.getCategoryId());

        Product product = Product.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .price(req.getPrice())
                .unit(req.getUnit().trim())
                .emoji(req.getEmoji())
                .tag(req.getTag())
                .tagType(req.getTagType())
                .bgGradient(req.getBgGradient())
                .available(req.getAvailable() != null ? req.getAvailable() : true)
                .stock(req.getStock() != null ? req.getStock() : 100)
                .featured(req.getFeatured() != null ? req.getFeatured() : false)
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .originalPrice(req.getOriginalPrice())
                .category(category)
                .build();

        return toProductResponse(productRepository.save(product));
    }

    /* ── Admin: Update ──────────────────────────────── */

    @Transactional
    public ProductResponse updateProduct(Long id, AdminProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));

        product.setCategory(resolveCategory(req.getCategoryId()));
        product.setName(req.getName().trim());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        product.setUnit(req.getUnit().trim());
        product.setEmoji(req.getEmoji());
        product.setTag(req.getTag());
        product.setTagType(req.getTagType());
        product.setBgGradient(req.getBgGradient());
        if (req.getAvailable()  != null) product.setAvailable(req.getAvailable());
        if (req.getStock()      != null) product.setStock(req.getStock());
        if (req.getFeatured()   != null) product.setFeatured(req.getFeatured());
        if (req.getSortOrder()  != null) product.setSortOrder(req.getSortOrder());
        product.setOriginalPrice(req.getOriginalPrice());

        return toProductResponse(productRepository.save(product));
    }

    /* ── Admin: Delete ──────────────────────────────── */

    @Transactional
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ApiException("Product not found", HttpStatus.NOT_FOUND);
        }
        productRepository.deleteById(id);
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

    @Transactional
    public ProductResponse uploadProductImage(Long id, MultipartFile file) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ApiException("Product not found", HttpStatus.NOT_FOUND));

        String original  = file.getOriginalFilename();
        String ext       = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.')) : ".jpg";
        String filename  = "product_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        Path dir  = Paths.get(uploadDir, "products");
        Path dest = dir.resolve(filename);

        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException("Failed to save image: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (product.getImageUrl() != null) {
            try { Files.deleteIfExists(Paths.get(uploadDir, "products",
                    Paths.get(product.getImageUrl()).getFileName().toString())); }
            catch (IOException ignored) {}
        }

        product.setImageUrl("/uploads/products/" + filename);
        return toProductResponse(productRepository.save(product));
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
        if (id == null) throw new ApiException("Category ID required", HttpStatus.BAD_REQUEST);
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("Category not found", HttpStatus.NOT_FOUND));

        String original = file.getOriginalFilename();
        String ext      = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.')) : ".jpg";
        String filename = "category_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;

        Path dir  = Paths.get(uploadDir, "categories");
        Path dest = dir.resolve(filename);

        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException("Failed to save image: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (category.getImageUrl() != null) {
            try { Files.deleteIfExists(Paths.get(uploadDir, "categories",
                    Paths.get(category.getImageUrl()).getFileName().toString())); }
            catch (IOException ignored) {}
        }

        category.setImageUrl("/uploads/categories/" + filename);
        return toCategoryResponse(categoryRepository.save(category));
    }
}
