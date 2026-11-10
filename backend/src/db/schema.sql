CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE order_status AS ENUM ('pending','processing','shipped','completed','cancelled');
CREATE TYPE checkout_state AS ENUM ('cart_verified','address_validated','payment_pending','paid','failed');
CREATE TYPE admin_role AS ENUM ('super_admin','chat_admin','warehouse_admin');
CREATE TYPE customer_segment AS ENUM ('retail','wholesale','reseller','loyal');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  segment customer_segment NOT NULL DEFAULT 'retail',
  loyalty_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role admin_role NOT NULL,
  totp_secret TEXT NOT NULL            -- 2FA is mandatory for every admin
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL, phone TEXT NOT NULL, line1 TEXT NOT NULL,
  city_id TEXT NOT NULL, postal_code TEXT NOT NULL, lat NUMERIC, lng NUMERIC
);

CREATE TABLE categories (            -- self-referencing: pillar -> major -> sub
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 3),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id INT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_html TEXT,               -- sanitized with an allow-list on write
  base_price NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,   -- powers margin reports
  weight_grams INT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  size TEXT, color TEXT, variant TEXT,
  price_override NUMERIC(12,2),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5
);

CREATE TABLE wholesale_tiers (
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  min_qty INT NOT NULL, unit_price NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (product_id, min_qty)
);

CREATE TYPE tracking_state AS ENUM ('ORDERED','SHIPPED','IN_CUSTOMS','OUT_FOR_DELIVERY','DELIVERED');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),             -- NULL for guest checkout
  guest_email CITEXT,
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL),
  status order_status NOT NULL DEFAULT 'pending',
  checkout_state checkout_state NOT NULL DEFAULT 'cart_verified',
  tracking_state tracking_state NOT NULL DEFAULT 'ORDERED',
  subtotal NUMERIC(12,2) NOT NULL,
  shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  shipping_address JSONB, courier TEXT, tracking_number TEXT,
  last_raw_status TEXT, tracking_updated_at TIMESTAMPTZ DEFAULT now(),
  payment_ref TEXT, paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tracking_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number TEXT,
  carrier TEXT,
  raw_status TEXT NOT NULL,
  mapped_state tracking_state NOT NULL,
  location TEXT,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tracking_events_order_id ON tracking_events(order_id);

CREATE TABLE order_items (
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  qty INT NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  PRIMARY KEY (order_id, variant_id)
);

CREATE TABLE payment_events (        -- webhook idempotency + trail
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL, event_id TEXT NOT NULL, payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE TABLE coupons (
  code TEXT PRIMARY KEY, kind TEXT NOT NULL, value NUMERIC NOT NULL,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, usage_limit INT, used INT DEFAULT 0
);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT,
  diff JSONB, ip INET, at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, email CITEXT, cart JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE site_settings (key TEXT PRIMARY KEY, value JSONB NOT NULL);
CREATE TABLE info_pages (slug TEXT PRIMARY KEY, title TEXT NOT NULL, body_html TEXT NOT NULL);
