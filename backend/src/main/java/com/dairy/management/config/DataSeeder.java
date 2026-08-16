package com.dairy.management.config;

import com.dairy.management.entity.Category;
import com.dairy.management.entity.Product;
import com.dairy.management.entity.User;
import com.dairy.management.repository.CategoryRepository;
import com.dairy.management.repository.ProductRepository;
import com.dairy.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    /** Password the seeder falls back to when ADMIN_PASSWORD is unset. */
    private static final String DEFAULT_ADMIN_PASSWORD = "admin123";

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Overridable so a publicly reachable deployment does not ship with the
    // well-known local credentials. Defaults keep local/docker setups working
    // exactly as before.
    @Value("${app.seed.admin-email:admin@dairy.com}")
    private String adminEmail;

    @Value("${app.seed.admin-password:" + DEFAULT_ADMIN_PASSWORD + "}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        seedAdminUser();
        if (categoryRepository.count() > 0) {
            log.info("Data already seeded — skipping.");
            return;
        }
        log.info("Seeding categories and products...");
        seedCategories();
        log.info("Seeding complete.");
    }

    @SuppressWarnings("null")
    private void seedAdminUser() {
        if (userRepository.existsByEmail(adminEmail)) return;

        userRepository.save(User.builder()
                .name("Admin")
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role("ADMIN")
                .build());

        if (DEFAULT_ADMIN_PASSWORD.equals(adminPassword)) {
            // Never print a real password to the logs — only the throwaway default,
            // which is public knowledge anyway and useful for local onboarding.
            log.warn("Admin user created with the DEFAULT password — email: {} / password: {}. "
                    + "Set ADMIN_PASSWORD (and ADMIN_EMAIL) before exposing this backend to the internet.",
                    adminEmail, DEFAULT_ADMIN_PASSWORD);
        } else {
            log.info("Admin user created — email: {} (password from ADMIN_PASSWORD)", adminEmail);
        }
    }

    private void seedCategories() {
        /* ── 1. Fresh Milk ──────────────────────────── */
        Category milk = save(Category.builder()
                .name("Fresh Milk").emoji("🥛")
                .description("Cow, Buffalo and A2 Milk")
                .bgColor("#f0fdf4").ringColor("#bbf7d0").sortOrder(1).build());

        saveProduct(Product.builder().name("Full Cream Milk").category(milk)
                .description("Rich, creamy cow milk. Pasteurised & homogenised. No preservatives.")
                .price(new BigDecimal("28")).originalPrice(new BigDecimal("32"))
                .unit("500 ml").emoji("🥛")
                .tag("BESTSELLER").tagType("success")
                .bgGradient("linear-gradient(135deg,#f0fdf4,#dcfce7)")
                .featured(true).stock(200).sortOrder(1).build());

        saveProduct(Product.builder().name("Full Cream Milk 1L").category(milk)
                .description("Same farm-fresh full cream milk — bigger pack for bigger families.")
                .price(new BigDecimal("52")).unit("1 L").emoji("🥛")
                .tag("POPULAR").tagType("success")
                .bgGradient("linear-gradient(135deg,#f0fdf4,#dcfce7)")
                .featured(false).stock(200).sortOrder(2).build());

        saveProduct(Product.builder().name("Toned Milk").category(milk)
                .description("Light toned milk with 3% fat. Perfect for tea, coffee & daily use.")
                .price(new BigDecimal("24")).unit("500 ml").emoji("🧉")
                .tag("LIGHT").tagType("success")
                .bgGradient("linear-gradient(135deg,#ecfdf5,#d1fae5)")
                .featured(false).stock(150).sortOrder(3).build());

        saveProduct(Product.builder().name("A2 Desi Cow Milk").category(milk)
                .description("Premium A2 beta-casein milk from indigenous Gir & Sahiwal cows. Easily digestible.")
                .price(new BigDecimal("42")).originalPrice(new BigDecimal("55"))
                .unit("500 ml").emoji("🐄")
                .tag("A2 PURE").tagType("info")
                .bgGradient("linear-gradient(135deg,#fef9ee,#fef3c7)")
                .featured(true).stock(100).sortOrder(4).build());

        saveProduct(Product.builder().name("Buffalo Milk").category(milk)
                .description("Thick, rich buffalo milk with 6-8% fat. Ideal for making paneer & sweets.")
                .price(new BigDecimal("34")).unit("500 ml").emoji("🐃")
                .tag("RICH FAT").tagType("success")
                .bgGradient("linear-gradient(135deg,#fdf4ff,#f3e8ff)")
                .featured(false).stock(120).sortOrder(5).build());

        /* ── 2. Paneer & Cheese ─────────────────────── */
        Category paneer = save(Category.builder()
                .name("Paneer & Cheese").emoji("🧀")
                .description("Fresh Paneer, Cottage Cheese")
                .bgColor("#fffbeb").ringColor("#fde68a").sortOrder(2).build());

        saveProduct(Product.builder().name("Fresh Paneer").category(paneer)
                .description("Soft, moist paneer made from farm-fresh whole milk. Same-day delivery.")
                .price(new BigDecimal("80")).unit("200 g").emoji("🧀")
                .tag("FRESH TODAY").tagType("success")
                .bgGradient("linear-gradient(135deg,#fffbeb,#fef3c7)")
                .featured(true).stock(80).sortOrder(1).build());

        saveProduct(Product.builder().name("Fresh Paneer 500g").category(paneer)
                .description("Family pack of soft, fresh paneer. Perfect for daily cooking.")
                .price(new BigDecimal("195")).unit("500 g").emoji("🧀")
                .tag("FAMILY PACK").tagType("success")
                .bgGradient("linear-gradient(135deg,#fffbeb,#fef3c7)")
                .featured(false).stock(60).sortOrder(2).build());

        saveProduct(Product.builder().name("Malai Paneer").category(paneer)
                .description("Extra-rich malai paneer with high cream content. Melt-in-mouth texture.")
                .price(new BigDecimal("95")).originalPrice(new BigDecimal("115"))
                .unit("200 g").emoji("🧈")
                .tag("PREMIUM").tagType("info")
                .bgGradient("linear-gradient(135deg,#fef9ee,#fde68a44)")
                .featured(false).stock(50).sortOrder(3).build());

        /* ── 3. Ghee & Butter ───────────────────────── */
        Category ghee = save(Category.builder()
                .name("Ghee & Butter").emoji("🧈")
                .description("Pure Ghee, Unsalted Butter")
                .bgColor("#fef3c7").ringColor("#fcd34d").sortOrder(3).build());

        saveProduct(Product.builder().name("Pure Cow Ghee").category(ghee)
                .description("Traditionally churned Bilona ghee from grass-fed desi cows. Rich in CLA & Omega-3.")
                .price(new BigDecimal("550")).originalPrice(new BigDecimal("649"))
                .unit("500 ml").emoji("🧈")
                .tag("PURE A2").tagType("info")
                .bgGradient("linear-gradient(135deg,#fef9ee,#fde68a44)")
                .featured(true).stock(60).sortOrder(1).build());

        saveProduct(Product.builder().name("Pure Cow Ghee 1L").category(ghee)
                .description("1 litre of authentic desi cow ghee. Best value family pack.")
                .price(new BigDecimal("1050")).unit("1 L").emoji("🧈")
                .tag("BEST VALUE").tagType("success")
                .bgGradient("linear-gradient(135deg,#fef9ee,#fde68a44)")
                .featured(false).stock(40).sortOrder(2).build());

        saveProduct(Product.builder().name("Unsalted Butter").category(ghee)
                .description("Creamy, fresh unsalted butter churned daily. Perfect for baking & cooking.")
                .price(new BigDecimal("65")).unit("100 g").emoji("🟡")
                .tag("FRESH").tagType("success")
                .bgGradient("linear-gradient(135deg,#fffbeb,#fef9c3)")
                .featured(false).stock(90).sortOrder(3).build());

        /* ── 4. Curd & Yogurt ───────────────────────── */
        Category curd = save(Category.builder()
                .name("Curd & Yogurt").emoji("🍦")
                .description("Thick Curd, Greek Yogurt")
                .bgColor("#eff6ff").ringColor("#bfdbfe").sortOrder(4).build());

        saveProduct(Product.builder().name("Thick Curd").category(curd)
                .description("Set curd made fresh daily. Rich in probiotics for a healthy gut.")
                .price(new BigDecimal("45")).unit("400 g").emoji("🍦")
                .tag("PROBIOTIC").tagType("success")
                .bgGradient("linear-gradient(135deg,#eff6ff,#dbeafe)")
                .featured(true).stock(120).sortOrder(1).build());

        saveProduct(Product.builder().name("Greek Yogurt").category(curd)
                .description("Thick, strained Greek-style yogurt. High protein, low sugar, creamy texture.")
                .price(new BigDecimal("55")).originalPrice(new BigDecimal("70"))
                .unit("150 g").emoji("🥣")
                .tag("HIGH PROTEIN").tagType("info")
                .bgGradient("linear-gradient(135deg,#f0fdf4,#dcfce7)")
                .featured(false).stock(80).sortOrder(2).build());

        saveProduct(Product.builder().name("Mishti Doi").category(curd)
                .description("Traditional Bengali sweet curd — perfectly caramelised and smooth.")
                .price(new BigDecimal("60")).unit("200 g").emoji("🍮")
                .tag("SPECIAL").tagType("success")
                .bgGradient("linear-gradient(135deg,#fdf4ff,#f3e8ff)")
                .featured(false).stock(60).sortOrder(3).build());

        /* ── 5. Farm Eggs ───────────────────────────── */
        Category eggs = save(Category.builder()
                .name("Farm Eggs").emoji("🥚")
                .description("Desi & Brown Eggs")
                .bgColor("#fdf4ff").ringColor("#e9d5ff").sortOrder(5).build());

        saveProduct(Product.builder().name("Desi Eggs (6 pcs)").category(eggs)
                .description("Free-range desi eggs from happy hens. Rich yolk, high protein, hormone-free.")
                .price(new BigDecimal("52")).unit("6 pcs").emoji("🥚")
                .tag("FREE RANGE").tagType("success")
                .bgGradient("linear-gradient(135deg,#fdf4ff,#f3e8ff)")
                .featured(false).stock(200).sortOrder(1).build());

        saveProduct(Product.builder().name("Desi Eggs (Dozen)").category(eggs)
                .description("12 farm-fresh desi eggs. No antibiotics, no hormones — purely natural.")
                .price(new BigDecimal("95")).originalPrice(new BigDecimal("110"))
                .unit("12 pcs").emoji("🥚")
                .tag("BESTSELLER").tagType("success")
                .bgGradient("linear-gradient(135deg,#fdf4ff,#f3e8ff)")
                .featured(true).stock(200).sortOrder(2).build());

        saveProduct(Product.builder().name("Brown Eggs (6 pcs)").category(eggs)
                .description("Premium brown-shelled eggs with extra-rich dark yolk. Omega-3 enriched.")
                .price(new BigDecimal("65")).unit("6 pcs").emoji("🟤")
                .tag("OMEGA-3").tagType("info")
                .bgGradient("linear-gradient(135deg,#fff7ed,#fed7aa)")
                .featured(false).stock(150).sortOrder(3).build());

        /* ── 6. Flavoured Milk ──────────────────────── */
        Category flavoured = save(Category.builder()
                .name("Flavoured Milk").emoji("🧋")
                .description("Chocolate, Strawberry & more")
                .bgColor("#fff1f2").ringColor("#fecdd3").sortOrder(6).build());

        saveProduct(Product.builder().name("Chocolate Milk").category(flavoured)
                .description("Real milk blended with natural cocoa. No artificial flavours. Kids love it!")
                .price(new BigDecimal("35")).unit("200 ml").emoji("🍫")
                .tag("KIDS FAVE").tagType("success")
                .bgGradient("linear-gradient(135deg,#fdf4ff,#f3e8ff)")
                .featured(false).stock(150).sortOrder(1).build());

        saveProduct(Product.builder().name("Strawberry Milk").category(flavoured)
                .description("Fresh milk with real strawberry puree. No artificial colours or preservatives.")
                .price(new BigDecimal("35")).unit("200 ml").emoji("🍓")
                .tag("NATURAL").tagType("success")
                .bgGradient("linear-gradient(135deg,#fff1f2,#ffe4e6)")
                .featured(false).stock(150).sortOrder(2).build());

        saveProduct(Product.builder().name("Badam Milk").category(flavoured)
                .description("Full cream milk enriched with almond paste and saffron. Traditional recipe.")
                .price(new BigDecimal("48")).originalPrice(new BigDecimal("58"))
                .unit("200 ml").emoji("🌰")
                .tag("PREMIUM").tagType("info")
                .bgGradient("linear-gradient(135deg,#fef9ee,#fef3c7)")
                .featured(false).stock(100).sortOrder(3).build());
    }

    @SuppressWarnings("null")
    private Category save(Category c) {
        return categoryRepository.save(c);
    }

    @SuppressWarnings("null")
    private void saveProduct(Product p) {
        productRepository.save(p);
    }
}
