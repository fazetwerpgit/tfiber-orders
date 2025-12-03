-- Add role-based commission rates
-- This allows different roles to have different commission percentages/amounts

-- Create role_commission_rates table for role-specific commission multipliers
CREATE TABLE IF NOT EXISTS role_commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('fiber_500', 'fiber_1gig', 'fiber_2gig', 'founders_club')),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_name, plan_type)
);

-- Insert default rates for existing roles (same as current base rates)
INSERT INTO role_commission_rates (role_name, plan_type, amount)
SELECT r.name, cr.plan_type, cr.amount
FROM roles r
CROSS JOIN commission_rates cr
ON CONFLICT (role_name, plan_type) DO NOTHING;

-- Enable RLS
ALTER TABLE role_commission_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can view commission rates
CREATE POLICY "Anyone can view role commission rates"
  ON role_commission_rates FOR SELECT
  USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_role_commission_rates_updated_at
  BEFORE UPDATE ON role_commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update the set_commission_amount function to use role-based rates
CREATE OR REPLACE FUNCTION set_commission_amount()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  commission DECIMAL(10, 2);
BEGIN
  -- Get the user's role
  SELECT role INTO user_role FROM users WHERE id = NEW.salesperson_id;

  -- Try to get role-specific commission rate
  SELECT amount INTO commission
  FROM role_commission_rates
  WHERE role_name = user_role AND plan_type = NEW.plan_type;

  -- Fall back to default commission rate if no role-specific rate exists
  IF commission IS NULL THEN
    SELECT amount INTO commission
    FROM commission_rates
    WHERE plan_type = NEW.plan_type;
  END IF;

  NEW.commission_amount = COALESCE(commission, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
