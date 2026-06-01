INSERT INTO categories (name, slug, description, display_order, active)
VALUES
('Coffee', 'coffee', 'Freshly brewed coffee drinks', 1, true),
('Bakery', 'bakery', 'Fresh bakery items', 2, true);

INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Cappuccino', 'cappuccino', 'Espresso with steamed milk foam', 'ACTIVE'
FROM categories WHERE slug = 'coffee';

INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Croissant', 'croissant', 'Fresh buttery croissant', 'ACTIVE'
FROM categories WHERE slug = 'bakery';

INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Small', 'CAP-SMALL', 120.00, 'INR', true
FROM products WHERE slug = 'cappuccino';

INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Medium', 'CAP-MEDIUM', 150.00, 'INR', true
FROM products WHERE slug = 'cappuccino';

INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Regular', 'CROISSANT-REG', 90.00, 'INR', true
FROM products WHERE slug = 'croissant';

INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 25, 0, 5 FROM product_variants WHERE sku = 'CAP-SMALL';

INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 15, 0, 5 FROM product_variants WHERE sku = 'CAP-MEDIUM';

INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 10, 0, 3 FROM product_variants WHERE sku = 'CROISSANT-REG';
