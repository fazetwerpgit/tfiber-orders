-- Ensure admin role for jacobmyers692@gmail.com
-- This migration handles both cases: user exists or doesn't exist yet

-- First, try to update existing user
UPDATE users
SET role = 'admin'
WHERE email = 'jacobmyers692@gmail.com';

-- Log the result (visible in Supabase logs)
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % rows to admin role', affected_rows;
END $$;

-- Create a function to auto-promote this email to admin on insert
CREATE OR REPLACE FUNCTION auto_promote_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'jacobmyers692@gmail.com' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-promote on insert (if not exists)
DROP TRIGGER IF EXISTS auto_promote_admin_trigger ON users;
CREATE TRIGGER auto_promote_admin_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_admin();
