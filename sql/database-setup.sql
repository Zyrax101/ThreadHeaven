-- ThreadHeaven Database Setup for Supabase
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- PRODUCTS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    material VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    description TEXT,
    active BOOLEAN DEFAULT true,
    rotation VARCHAR(20) DEFAULT 'rot-1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sample products
INSERT INTO products (name, material, price, image_url, description, rotation) VALUES
    ('Onyx Jacket', 'LEATHER', 285.00, 'assets/pants/pants.png', 'Premium leather jacket with minimalist design. A timeless piece for the modern wardrobe.', 'rot-1'),
    ('Tech Cargo', 'NYLON', 120.00, 'assets/pants/pants.png', 'Technical cargo pants with multiple pockets. Designed for both function and style.', 'rot-2'),
    ('The Overcoat', 'WOOL', 345.00, 'assets/pants/pants.png', 'Classic wool overcoat with modern cut. Perfect for transitional weather.', 'rot-3'),
    ('Boxy Tee', 'COTTON', 55.00, 'assets/pants/pants.png', 'Heavyweight cotton tee with relaxed fit. Essential basics elevated.', 'rot-2'),
    ('Combat Boot', 'LEATHER', 210.00, 'assets/pants/pants.png', 'Military-inspired leather boots. Built for durability and style.', 'rot-1'),
    ('Tech Parka', 'FLEECE', 145.00, 'assets/pants/pants.png', 'Insulated fleece parka with technical details. Perfect for cold weather.', 'rot-3');

-- ======================
-- CUSTOMERS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================
-- ORDERS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================
-- ORDER ITEMS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    size VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================
-- ROW LEVEL SECURITY (RLS)
-- ======================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (allows re-running script)
DROP POLICY IF EXISTS "Products are publicly readable" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
DROP POLICY IF EXISTS "Authenticated users can read customers" ON customers;
DROP POLICY IF EXISTS "Anyone can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can read order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

-- Products: Anyone can read, only authenticated users can modify
CREATE POLICY "Products are publicly readable" ON products
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- Customers: Only authenticated users can access
CREATE POLICY "Authenticated users can read customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert customers" ON customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Orders: Anyone can insert (for guest checkout), authenticated can read all
CREATE POLICY "Authenticated users can read orders" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Order Items: Same as orders
CREATE POLICY "Authenticated users can read order items" ON order_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert order items" ON order_items
    FOR INSERT WITH CHECK (true);

-- ======================
-- INDEXES FOR PERFORMANCE
-- ======================
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ======================
-- UPDATED_AT TRIGGER
-- ======================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Done! Your database is now ready.
-- Remember to create an admin user in Authentication > Users to access the admin dashboard.
