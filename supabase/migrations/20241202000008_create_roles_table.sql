-- Create roles table for dynamic role management
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'gray', -- For UI badge colors: gray, blue, green, red, pink, purple, amber
  permissions JSONB DEFAULT '{}', -- For future permission system
  is_system BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system roles
INSERT INTO roles (name, display_name, description, color, is_system) VALUES
  ('admin', 'Admin', 'Full access to all features and settings', 'red', TRUE),
  ('manager', 'Manager', 'Can view reports and manage team members', 'blue', TRUE),
  ('salesperson', 'Salesperson', 'Can create and view their own orders', 'gray', TRUE)
ON CONFLICT (name) DO NOTHING;

-- RLS policies for roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Everyone can read roles
CREATE POLICY "Anyone can read roles"
  ON roles FOR SELECT
  USING (true);

-- Only admins can modify roles (handled via server actions with admin client)
