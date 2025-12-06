-- Migration: Add sale_type to orders for gamification points calculation
-- This allows distinguishing between standard sales, upgrades, and multi-service bundles

-- Add sale_type column to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS sale_type TEXT
DEFAULT 'standard'
CHECK (sale_type IN ('standard', 'upgrade', 'multi_service'));

-- Add add_ons_count for tracking add-on services (each worth 5 points)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS add_ons_count INTEGER DEFAULT 0;

-- Create index for efficient filtering by sale type
CREATE INDEX IF NOT EXISTS idx_orders_sale_type ON orders(sale_type);

-- Add comment for documentation
COMMENT ON COLUMN orders.sale_type IS 'Type of sale for points calculation: standard (10pts), upgrade (20pts), multi_service (30pts)';
COMMENT ON COLUMN orders.add_ons_count IS 'Number of add-on services sold with this order (5pts each)';
