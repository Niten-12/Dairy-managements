-- ============================================================================
-- V2 — Add products.sort_order
--
-- Root-cause fix for "Failed to load products" (every product/category API
-- returning 500 since 2026-06-21):
--
-- The Product entity declares sort_order as NOT NULL, but hibernate
-- ddl-auto=update generated  ALTER TABLE products ADD COLUMN sort_order
-- integer NOT NULL  — without a DEFAULT. PostgreSQL rejects that on a
-- non-empty table, Hibernate logged the failure and booted anyway, and every
-- subsequent SELECT referenced the missing column (SQLSTATE 42703).
--
-- DEFAULT 0 backfills all existing rows in the same statement (metadata-only
-- and non-blocking on PostgreSQL 11+). The default is kept afterwards as a
-- safety net; Hibernate always writes the column explicitly on insert, so the
-- application never relies on it.
--
-- IF NOT EXISTS keeps this migration safe for any environment where the
-- column was already added by hand while debugging.
-- ============================================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
