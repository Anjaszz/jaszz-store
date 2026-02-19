-- Create Categories Table (Dynamic Catalog)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT, 
  image_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Initial Categories
INSERT INTO categories (name, slug, icon, description, display_order)
VALUES 
('Pulsa & Data', 'pulsa', 'smartphone', 'Top up pulsa dan paket data semua operator', 1),
('Mobile Legends', 'mlbb', 'gamepad', 'Top up diamond MLBB murah instant', 2),
('Free Fire', 'free-fire', 'gamepad', 'Top up diamond Free Fire murah instant', 3),
('Akun Premium', 'akun', 'user', 'Beli akun Netflix, Spotify, Canva premium', 4);

-- Create Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- Keep for backward compatibility/legacy or redundancy
  price DECIMAL(12, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  is_auto_delivery BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for pre-loaded stock items (Auto Delivery)
CREATE TABLE product_stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- e.g. "email:password" or "TOKEN-123"
  is_used BOOLEAN DEFAULT false,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT,
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) DEFAULT 0,
  admin_fee DECIMAL(12, 2) DEFAULT 0,
  service_fee DECIMAL(12, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'canceled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'expired')),
  midtrans_token TEXT,
  customer_details JSONB NOT NULL,
  delivery_data TEXT, -- Column to store sent voucher/account data
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy for viewing categories (Public)
CREATE POLICY "Allow public select on categories" 
ON categories FOR SELECT USING (true);

-- Policy for managing categories (Admin only)
CREATE POLICY "Allow authenticated full access on categories" 
ON categories FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for products (Public view, Admin manage)
CREATE POLICY "Allow public select on products" 
ON products FOR SELECT USING (true);

CREATE POLICY "Allow authenticated full access on products" 
ON products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update products" 
ON products FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies for Orders (Admin can see all, Users can see their own by email)
CREATE POLICY "Public can create orders" 
ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can see their own orders" 
ON orders FOR SELECT USING (true); -- Allowing all for tracking page simplify

CREATE POLICY "Admins can manage all orders"
ON orders FOR ALL USING (auth.role() = 'authenticated');

-- Insert Sample Data
... (the sample data part)

-- Create Shop Settings Table
CREATE TABLE shop_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy for settings
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on settings" ON shop_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin manage settings" ON shop_settings FOR ALL USING (auth.role() = 'authenticated');

-- Insert Initial Fee Settings
INSERT INTO shop_settings (key, value)
VALUES ('fee_settings', '{"admin_fee_percent": 0, "tax_percent": 0, "service_fee_percent": 0}');

-- Add handle_auto_delivery RPC to support multiple items
CREATE OR REPLACE FUNCTION handle_auto_delivery(
    p_order_id UUID,
    p_stock_item_ids UUID[],
    p_content TEXT
) RETURNS VOID AS $$
BEGIN
    -- Mark multiple stock items as used
    UPDATE product_stock_items 
    SET is_used = true, order_id = p_order_id 
    WHERE id = ANY(p_stock_item_ids);

    -- Complete the order with combined content
    UPDATE orders 
    SET status = 'completed', delivery_data = p_content 
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically decrement stock when a new order is created
-- Now with strict stock validation to prevent overselling
CREATE OR REPLACE FUNCTION decrement_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_stock INTEGER;
BEGIN
    -- Get current stock with LOCK for atomic transaction
    SELECT stock INTO v_stock FROM products WHERE id = NEW.product_id FOR UPDATE;
    
    -- Validate stock availability
    IF v_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient stock: Available %, Requested %', v_stock, NEW.quantity;
    END IF;

    -- Decrement stock
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_stock
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_order();

-- Trigger to automatically increment product stock when new items are added to product_stock_items
CREATE OR REPLACE FUNCTION increment_stock_on_item_add()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock + 1
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_stock_on_add
AFTER INSERT ON product_stock_items
FOR EACH ROW
EXECUTE FUNCTION increment_stock_on_item_add();

-- Trigger to automatically decrement product stock when items are deleted from product_stock_items
CREATE OR REPLACE FUNCTION decrement_stock_on_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrement if it was an unused item (avoid double decrement with order completed)
    IF OLD.is_used = false THEN
        UPDATE products
        SET stock = GREATEST(0, stock - 1)
        WHERE id = OLD.product_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_stock_on_delete
AFTER DELETE ON product_stock_items
FOR EACH ROW
EXECUTE FUNCTION decrement_stock_on_item_delete();
