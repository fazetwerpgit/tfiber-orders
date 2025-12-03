-- T-Fiber Orders Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Google Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'salesperson' CHECK (role IN ('admin', 'manager', 'salesperson')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commission rates by plan
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL UNIQUE CHECK (plan_type IN ('fiber_500', 'fiber_1gig', 'fiber_2gig', 'founders_club')),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default commission rates
INSERT INTO commission_rates (plan_type, amount) VALUES
  ('fiber_500', 25.00),
  ('fiber_1gig', 40.00),
  ('fiber_2gig', 50.00),
  ('founders_club', 60.00)
ON CONFLICT (plan_type) DO NOTHING;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  service_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('fiber_500', 'fiber_1gig', 'fiber_2gig', 'founders_club')),
  pricing_tier TEXT NOT NULL CHECK (pricing_tier IN ('voice_autopay', 'autopay_only', 'no_discounts')),
  monthly_price DECIMAL(10, 2) NOT NULL,
  install_date DATE NOT NULL,
  install_time_slot TEXT NOT NULL CHECK (install_time_slot IN ('8-10', '10-12', '12-3', '3-5')),
  access_notes TEXT,
  salesperson_id UUID NOT NULL REFERENCES users(id),
  sale_location TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'scheduled', 'installed', 'completed', 'cancelled')),
  commission_amount DECIMAL(10, 2),
  commission_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_salesperson ON orders(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_install_date ON orders(install_date);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins and managers can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Orders policies
CREATE POLICY "Salespeople can view their own orders" ON orders
  FOR SELECT USING (salesperson_id::text = auth.uid()::text);

CREATE POLICY "Admins and managers can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Salespeople can insert orders" ON orders
  FOR INSERT WITH CHECK (salesperson_id::text = auth.uid()::text);

CREATE POLICY "Salespeople can update their own orders" ON orders
  FOR UPDATE USING (salesperson_id::text = auth.uid()::text);

CREATE POLICY "Admins can update any order" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- Commission rates policies
CREATE POLICY "Anyone can view commission rates" ON commission_rates
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update commission rates" ON commission_rates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commission_rates_updated_at
  BEFORE UPDATE ON commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-set commission amount on order insert
CREATE OR REPLACE FUNCTION set_commission_amount()
RETURNS TRIGGER AS $$
BEGIN
  SELECT amount INTO NEW.commission_amount
  FROM commission_rates
  WHERE plan_type = NEW.plan_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_commission
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_commission_amount();
