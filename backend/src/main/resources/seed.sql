-- ============================================================
-- Dairy Management System — Seed Data
-- Run this ONCE inside PostgreSQL after first docker compose up
-- ============================================================

-- Categories
INSERT INTO categories (name, emoji, description, bg_color, ring_color, sort_order)
VALUES
  ('Milk',       '🥛', 'Fresh farm milk delivered daily',            '#f0fdf4', '#86efac', 1),
  ('Paneer',     '🧀', 'Soft homemade paneer',                       '#fef3c7', '#fde68a', 2),
  ('Curd',       '🥄', 'Thick creamy dahi',                          '#eff6ff', '#bfdbfe', 3),
  ('Ghee',       '🫙', 'Pure desi ghee',                             '#fff7ed', '#fed7aa', 4),
  ('Butter',     '🧈', 'Fresh white butter',                          '#fdf4ff', '#e9d5ff', 5),
  ('Sweets',     '🍮', 'Dairy-based Indian sweets',                  '#fef2f2', '#fecaca', 6)
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Full Cream Milk', 'Farm-fresh full cream milk — rich, creamy and delivered by 6 AM', 28.00, '500 ml',
  '🥛', 'BESTSELLER', 'success',
  'linear-gradient(135deg,#f0fdf4,#dcfce7)',
  true, 200, true, id FROM categories WHERE name='Milk'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Toned Milk', 'Low-fat toned milk — great for health-conscious families', 22.00, '500 ml',
  '🥛', 'LOW FAT', 'info',
  'linear-gradient(135deg,#eff6ff,#dbeafe)',
  true, 150, false, id FROM categories WHERE name='Milk'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Double Toned Milk', 'Extra light double-toned milk — perfect for weight watchers', 20.00, '500 ml',
  '🥛', NULL, 'success',
  'linear-gradient(135deg,#f0fdf4,#dcfce7)',
  true, 100, false, id FROM categories WHERE name='Milk'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Fresh Paneer', 'Soft, crumble-free fresh paneer made from full cream milk', 85.00, '200 g',
  '🧀', 'FRESH', 'success',
  'linear-gradient(135deg,#fef3c7,#fde68a)',
  true, 80, true, id FROM categories WHERE name='Paneer'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Malai Paneer', 'Ultra-soft malai paneer — restaurant quality at home', 110.00, '200 g',
  '🧀', 'PREMIUM', 'warning',
  'linear-gradient(135deg,#fff7ed,#fed7aa)',
  true, 50, true, id FROM categories WHERE name='Paneer'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Set Dahi', 'Thick, creamy set curd — naturally cultured overnight', 35.00, '400 g',
  '🥄', 'PROBIOTIC', 'info',
  'linear-gradient(135deg,#eff6ff,#dbeafe)',
  true, 120, false, id FROM categories WHERE name='Curd'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Pure Desi Ghee', 'Traditional hand-churned desi ghee — golden aroma, rich taste', 280.00, '250 ml',
  '🫙', 'BESTSELLER', 'success',
  'linear-gradient(135deg,#fff7ed,#fed7aa)',
  true, 60, true, id FROM categories WHERE name='Ghee'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'White Butter', 'Lightly salted fresh white butter — perfect for parathas', 65.00, '100 g',
  '🧈', 'NEW', 'info',
  'linear-gradient(135deg,#fdf4ff,#e9d5ff)',
  true, 90, false, id FROM categories WHERE name='Butter'
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, unit, emoji, tag, tag_type, bg_gradient, available, stock, featured, category_id)
SELECT
  'Khoa', 'Pure milk khoa — ideal for making gulab jamun and barfi', 120.00, '250 g',
  '🍮', NULL, 'success',
  'linear-gradient(135deg,#fef2f2,#fecaca)',
  true, 40, false, id FROM categories WHERE name='Sweets'
ON CONFLICT DO NOTHING;
