-- ============================================================================
-- V3 — Product data-integrity constraints
--
-- Pre-migration compatibility (verified against live data 2026-07-13, 9 rows):
--   price<=0: 0   original_price<=0: 0   original_price<price: 0
--   stock<0: 0    sort_order<0: 0       duplicate lower(name): 0
--   tag_type values present: success, info, warning (all already canonical)
-- Every constraint below is therefore satisfied by existing data; no row is
-- rewritten except the defensive tag_type normalization, which affects 0 live
-- rows and only matters for environments seeded via DataSeeder.
-- ============================================================================

-- ── tag_type canonicalization ──────────────────────────────────────────────
-- Canonical set: success | warning | error | info (matches the admin form and
-- the live DB). Map any legacy storefront vocabulary; blank unknowns so the
-- CHECK below always holds. DataSeeder is updated in the same change to emit
-- canonical values (it runs AFTER Flyway, so it must not reintroduce these).
UPDATE products SET tag_type = 'success' WHERE tag_type IN ('best', 'fresh');
UPDATE products SET tag_type = 'info'    WHERE tag_type = 'new';
UPDATE products SET tag_type = 'warning' WHERE tag_type = 'premium';
UPDATE products SET tag_type = NULL
    WHERE tag_type IS NOT NULL
      AND tag_type NOT IN ('success', 'warning', 'error', 'info');

-- ── Money / quantity invariants ────────────────────────────────────────────
ALTER TABLE products ADD CONSTRAINT chk_products_price_positive
    CHECK (price > 0);
ALTER TABLE products ADD CONSTRAINT chk_products_original_price_positive
    CHECK (original_price IS NULL OR original_price > 0);
ALTER TABLE products ADD CONSTRAINT chk_products_original_ge_price
    CHECK (original_price IS NULL OR original_price >= price);
ALTER TABLE products ADD CONSTRAINT chk_products_stock_nonneg
    CHECK (stock >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_sortorder_nonneg
    CHECK (sort_order >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_tagtype
    CHECK (tag_type IS NULL OR tag_type IN ('success', 'warning', 'error', 'info'));

-- ── Product identity: case-insensitive unique name ─────────────────────────
-- The naming convention already encodes variants into the name
-- (e.g. "Full Cream Milk" vs "Full Cream Milk 1L"), so name is the identity.
CREATE UNIQUE INDEX uk_products_name_lower ON products (lower(name));

-- ── Category relationship: data-preserving unlink on delete ────────────────
-- Deleting a category must NEVER delete its products. ON DELETE SET NULL makes
-- the database uncategorise them, replacing the app-side N+1 unlink loop.
ALTER TABLE products DROP CONSTRAINT IF EXISTS fkog2rp4qthbtt2lfyhfo32lsw9;
ALTER TABLE products ADD CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL;
