-- ============================================================================
-- V1 — Baseline schema
--
-- Faithful reproduction of the live PostgreSQL schema as captured via pg_dump
-- on 2026-07-13, BEFORE Flyway was introduced (schema originally produced by
-- hibernate ddl-auto=update over time).
--
-- How this file is used:
--   * EXISTING (non-empty) databases NEVER execute it. They are baselined at
--     version 1 (spring.flyway.baseline-version=1 + baseline-on-migrate=true),
--     so Flyway records a baseline marker and starts them at V2.
--   * FRESH (empty) databases execute it as the first migration, followed by
--     V2 and everything after, producing a schema identical to production.
--
-- Deliberate notes:
--   * products.sort_order is ABSENT here on purpose — it was missing from the
--     live schema (root cause of the product API 500s). V2 adds it. Do not
--     "fix" it in this file: a baseline must match what it represents.
--   * users.email is NOT NULL in the live schema even though the entity marks
--     it nullable (phone-only users). Kept as-is; relaxing it is a separate,
--     deliberate migration.
--   * The live DB also contains the pgcrypto extension; nothing in the
--     application references it, so it is intentionally not recreated here.
--   * Constraint/index names are kept identical to the Hibernate-generated
--     ones in the live DB so all environments stay byte-for-byte comparable.
-- ============================================================================

CREATE TABLE users (
    id                 bigserial PRIMARY KEY,
    created_at         timestamp(6),
    email              varchar(255) NOT NULL,
    name               varchar(255) NOT NULL,
    password           varchar(255) NOT NULL,
    role               varchar(255) NOT NULL,
    updated_at         timestamp(6),
    phone              varchar(20),
    two_factor_secret  varchar(64),
    two_factor_enabled boolean      NOT NULL DEFAULT false,
    username           varchar(50),
    active             boolean      NOT NULL DEFAULT true,
    last_login_at      timestamp(6),
    CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email)
);

CREATE UNIQUE INDEX uk_users_username ON users (username) WHERE username IS NOT NULL;

CREATE TABLE categories (
    id          bigserial PRIMARY KEY,
    bg_color    varchar(255),
    description varchar(255),
    emoji       varchar(255),
    name        varchar(255) NOT NULL,
    ring_color  varchar(255),
    sort_order  integer      NOT NULL,
    image_url   varchar(500),
    CONSTRAINT uk_t8o6pivur7nn124jehx7cygw5 UNIQUE (name)
);

CREATE TABLE products (
    id             bigserial PRIMARY KEY,
    available      boolean       NOT NULL,
    bg_gradient    varchar(200),
    created_at     timestamp(6),
    description    varchar(500),
    emoji          varchar(255),
    featured       boolean       NOT NULL,
    name           varchar(255)  NOT NULL,
    price          numeric(10,2) NOT NULL,
    stock          integer       NOT NULL,
    tag            varchar(255),
    tag_type       varchar(255),
    unit           varchar(255)  NOT NULL,
    updated_at     timestamp(6),
    category_id    bigint,
    image_url      varchar(500),
    original_price numeric(10,2),
    CONSTRAINT fkog2rp4qthbtt2lfyhfo32lsw9 FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE orders (
    id               bigserial PRIMARY KEY,
    created_at       timestamp(6),
    delivery_address varchar(500)  NOT NULL,
    delivery_city    varchar(255),
    delivery_name    varchar(255)  NOT NULL,
    delivery_phone   varchar(20)   NOT NULL,
    delivery_pincode varchar(10),
    notes            varchar(500),
    order_number     varchar(255)  NOT NULL,
    status           varchar(255)  NOT NULL,
    total_amount     numeric(10,2) NOT NULL,
    updated_at       timestamp(6),
    user_id          bigint        NOT NULL,
    payment_method   varchar(20),
    CONSTRAINT uk_nthkiu7pgmnqnu86i2jyoe2v7 UNIQUE (order_number),
    CONSTRAINT orders_status_check CHECK (status IN
        ('PENDING', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
    CONSTRAINT fk32ql8ubntj5uh44ph9659tiih FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE order_items (
    id            bigserial PRIMARY KEY,
    product_emoji varchar(255),
    product_id    bigint,
    product_name  varchar(255)  NOT NULL,
    product_unit  varchar(255),
    quantity      integer       NOT NULL,
    subtotal      numeric(10,2) NOT NULL,
    unit_price    numeric(10,2) NOT NULL,
    order_id      bigint        NOT NULL,
    CONSTRAINT fkbioxgbv59vetrxe0ejfubep1w FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE TABLE milk_collections (
    id              bigserial PRIMARY KEY,
    collection_date date          NOT NULL,
    created_at      timestamp(6),
    fat_percentage  numeric(4,2),
    notes           varchar(300),
    quantity_litres numeric(6,2)  NOT NULL,
    session         varchar(255)  NOT NULL,
    farmer_id       bigint        NOT NULL,
    CONSTRAINT milk_collections_session_check CHECK (session IN ('MORNING', 'EVENING')),
    CONSTRAINT fkdos0gbe4scuyst6mpjbwptcwd FOREIGN KEY (farmer_id) REFERENCES users (id)
);

CREATE TABLE audit_logs (
    id                bigserial PRIMARY KEY,
    action            varchar(50)  NOT NULL,
    created_at        timestamp(6),
    details           varchar(255),
    performed_by      varchar(255) NOT NULL,
    target_user_email varchar(255),
    target_user_id    bigint       NOT NULL,
    target_user_name  varchar(255)
);
