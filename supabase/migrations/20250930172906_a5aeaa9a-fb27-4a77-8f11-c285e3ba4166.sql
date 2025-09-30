-- Create enum types
CREATE TYPE user_role AS ENUM ('store_owner', 'admin');
CREATE TYPE order_status AS ENUM ('draft', 'pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE return_status AS ENUM ('requested', 'approved', 'rejected', 'received', 'completed');
CREATE TYPE kit_upgrade_status AS ENUM ('pending_approval', 'approved', 'rejected');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'store_owner',
  locale TEXT NOT NULL DEFAULT 'en',
  must_reset BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Stores table (without RLS policies yet)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- User-Store mapping (many-to-many)
CREATE TABLE user_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their store assignments"
  ON user_stores FOR SELECT
  USING (auth.uid() = user_id);

-- Now add stores RLS policy that depends on user_stores
CREATE POLICY "Store owners can view their assigned stores"
  ON stores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_stores
      WHERE user_stores.store_id = stores.id
      AND user_stores.user_id = auth.uid()
    )
  );

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  sizes TEXT[],
  images TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Kits table
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  category TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_standard BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active kits"
  ON kits FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Kit products (defines what products are in each kit)
CREATE TABLE kit_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kit_id, product_id, size)
);

ALTER TABLE kit_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view kit products"
  ON kit_products FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Kit availability (which stores can order which kits)
CREATE TABLE kit_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(kit_id, store_id)
);

ALTER TABLE kit_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view kit availability for their stores"
  ON kit_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_stores
      WHERE user_stores.store_id = kit_availability.store_id
      AND user_stores.user_id = auth.uid()
    )
  );

-- Quotas table (limits for kits or products)
CREATE TABLE quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quota_limit INTEGER NOT NULL,
  quota_used INTEGER NOT NULL DEFAULT 0,
  reset_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (store_id IS NOT NULL OR user_id IS NOT NULL),
  CHECK (kit_id IS NOT NULL OR product_id IS NOT NULL)
);

ALTER TABLE quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotas for their stores"
  ON quotas FOR SELECT
  USING (
    (user_id = auth.uid()) OR
    (store_id IN (
      SELECT store_id FROM user_stores
      WHERE user_id = auth.uid()
    ))
  );

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_status order_status NOT NULL DEFAULT 'draft',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  kit_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  individual_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND order_status = 'draft');

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  kit_id UUID REFERENCES kits(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  unit_price DECIMAL(10,2) NOT NULL,
  extended_price DECIMAL(10,2) NOT NULL,
  is_kit BOOLEAN NOT NULL DEFAULT false,
  kit_upgrade_status kit_upgrade_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (product_id IS NOT NULL OR kit_id IS NOT NULL)
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items for their orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Returns table
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  return_status return_status NOT NULL DEFAULT 'requested',
  reason TEXT,
  is_full_kit BOOLEAN NOT NULL DEFAULT false,
  refund_amount DECIMAL(10,2),
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own returns"
  ON returns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create returns for their orders"
  ON returns FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = returns.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role, locale)
  VALUES (
    NEW.id,
    NEW.email,
    'store_owner',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kits_updated_at BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotas_updated_at BEFORE UPDATE ON quotas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate unique return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX idx_user_stores_store_id ON user_stores(store_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_kit_products_kit_id ON kit_products(kit_id);
CREATE INDEX idx_kit_availability_store_id ON kit_availability(store_id);
CREATE INDEX idx_returns_order_id ON returns(order_id);
CREATE INDEX idx_returns_user_id ON returns(user_id);