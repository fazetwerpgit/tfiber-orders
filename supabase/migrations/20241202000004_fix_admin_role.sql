-- Fix admin role - run after user has logged in at least once
-- This ensures the user exists in the users table before updating

UPDATE users SET role = 'admin' WHERE email = 'jacobmyers692@gmail.com';

-- Also add an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
