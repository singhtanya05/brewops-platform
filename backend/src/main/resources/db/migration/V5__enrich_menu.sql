-- Update existing items to USD and realistic prices
UPDATE product_variants SET price = 3.50, currency = 'USD' WHERE sku = 'CAP-SMALL';
UPDATE product_variants SET price = 4.25, currency = 'USD' WHERE sku = 'CAP-MEDIUM';
UPDATE product_variants SET price = 3.00, currency = 'USD' WHERE sku = 'CROISSANT-REG';

-- Insert categories 'Matcha' and 'Cold Fusions' if they don't exist
INSERT INTO categories (name, slug, description, display_order, active)
VALUES
('Matcha', 'matcha', 'Pure organic ceremonial stone-ground matchas', 3, true),
('Cold Fusions', 'cold', 'Refreshing iced fusions and signature cold brews', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Let's add more products to Coffee category
INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Signature Vanilla Latte', 'vanilla-latte', 'Rich espresso with house-made vanilla bean syrup and silky steamed milk', 'ACTIVE'
FROM categories WHERE slug = 'coffee'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Organic Cold Brew', 'cold-brew', 'Steeped for 18 hours in cold filtered water for an ultra-smooth finish', 'ACTIVE'
FROM categories WHERE slug = 'coffee'
ON CONFLICT (slug) DO NOTHING;

-- Let's add products to Matcha category
INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Ceremonial Matcha Latte', 'matcha-latte', 'Stone-ground green tea whisked with creamy steamed milk', 'ACTIVE'
FROM categories WHERE slug = 'matcha'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Strawberry Matcha Fusion', 'strawberry-matcha', 'Iced matcha layered over fresh strawberry puree and milk', 'ACTIVE'
FROM categories WHERE slug = 'matcha'
ON CONFLICT (slug) DO NOTHING;

-- Let's add products to Cold Fusions category
INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Lavender Honey Lemonade', 'lavender-lemonade', 'Fresh squeezed lemon juice infused with natural lavender and honey', 'ACTIVE'
FROM categories WHERE slug = 'cold'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, status)
SELECT id, 'Passionfruit Hibiscus Fizz', 'hibiscus-fizz', 'Shaken organic hibiscus tea, passionfruit syrup, and sparkling water', 'ACTIVE'
FROM categories WHERE slug = 'cold'
ON CONFLICT (slug) DO NOTHING;

-- Let's add variants for Vanilla Latte
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Small', 'LATTE-SMALL', 4.00, 'USD', true FROM products WHERE slug = 'vanilla-latte' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Medium', 'LATTE-MEDIUM', 4.75, 'USD', true FROM products WHERE slug = 'vanilla-latte' ON CONFLICT (sku) DO NOTHING;

-- Let's add variants for Cold Brew
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Regular', 'CB-REG', 3.75, 'USD', true FROM products WHERE slug = 'cold-brew' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Nitro', 'CB-NITRO', 4.50, 'USD', true FROM products WHERE slug = 'cold-brew' ON CONFLICT (sku) DO NOTHING;

-- Let's add variants for Matcha Latte
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Hot', 'MATCHA-HOT', 4.50, 'USD', true FROM products WHERE slug = 'matcha-latte' ON CONFLICT (sku) DO NOTHING;
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Iced', 'MATCHA-ICED', 4.75, 'USD', true FROM products WHERE slug = 'matcha-latte' ON CONFLICT (sku) DO NOTHING;

-- Let's add variants for Strawberry Matcha
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Iced', 'STRAWBERRY-MATCHA-ICED', 5.25, 'USD', true FROM products WHERE slug = 'strawberry-matcha' ON CONFLICT (sku) DO NOTHING;

-- Let's add variants for Lavender Lemonade
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Regular', 'LAV-LEM-REG', 4.25, 'USD', true FROM products WHERE slug = 'lavender-lemonade' ON CONFLICT (sku) DO NOTHING;

-- Let's add variants for Passionfruit Fizz
INSERT INTO product_variants (product_id, name, sku, price, currency, active)
SELECT id, 'Regular', 'PASSION-FIZZ-REG', 4.50, 'USD', true FROM products WHERE slug = 'hibiscus-fizz' ON CONFLICT (sku) DO NOTHING;

-- Add inventory for all variants
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 50, 0, 5 FROM product_variants WHERE sku = 'LATTE-SMALL' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 50, 0, 5 FROM product_variants WHERE sku = 'LATTE-MEDIUM' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 60, 0, 5 FROM product_variants WHERE sku = 'CB-REG' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 40, 0, 5 FROM product_variants WHERE sku = 'CB-NITRO' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 30, 0, 5 FROM product_variants WHERE sku = 'MATCHA-HOT' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 30, 0, 5 FROM product_variants WHERE sku = 'MATCHA-ICED' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 25, 0, 5 FROM product_variants WHERE sku = 'STRAWBERRY-MATCHA-ICED' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 35, 0, 5 FROM product_variants WHERE sku = 'LAV-LEM-REG' ON CONFLICT (variant_id) DO NOTHING;
INSERT INTO inventory (variant_id, available_quantity, reserved_quantity, low_stock_threshold)
SELECT id, 35, 0, 5 FROM product_variants WHERE sku = 'PASSION-FIZZ-REG' ON CONFLICT (variant_id) DO NOTHING;
