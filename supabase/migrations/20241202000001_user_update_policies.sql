-- Migration: Add user update policies
-- Allows admins to update any user (for role changes)
-- Allows users to update their own profile (name)

-- Allow admins to update any user
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin')
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);
