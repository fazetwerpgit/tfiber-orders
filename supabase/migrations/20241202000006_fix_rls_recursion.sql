-- FIX INFINITE RECURSION IN RLS POLICIES
-- The problem: policies on "users" table query the "users" table, causing infinite recursion

-- Step 1: Drop ALL existing policies on users table
DO $$
BEGIN
  -- Drop all policies on users
  DROP POLICY IF EXISTS "Admins and managers can view all users" ON users;
  DROP POLICY IF EXISTS "Users can view their own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
  DROP POLICY IF EXISTS "Users can view own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert own profile" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
END $$;

-- Step 2: Drop ALL existing policies on orders table
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins and managers can view all orders" ON orders;
  DROP POLICY IF EXISTS "Admins can update any order" ON orders;
  DROP POLICY IF EXISTS "Salespeople can view their own orders" ON orders;
  DROP POLICY IF EXISTS "Salespeople can insert orders" ON orders;
  DROP POLICY IF EXISTS "Salespeople can update their own orders" ON orders;
  DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
  DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
  DROP POLICY IF EXISTS "Users can update own orders" ON orders;
END $$;

-- Step 3: Drop ALL existing policies on commission_rates table
DO $$
BEGIN
  DROP POLICY IF EXISTS "Only admins can update commission rates" ON commission_rates;
  DROP POLICY IF EXISTS "Anyone can view commission rates" ON commission_rates;
  DROP POLICY IF EXISTS "Anyone can view rates" ON commission_rates;
END $$;

-- Step 4: Create simple, non-recursive policies for USERS table
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Step 5: Create simple policies for ORDERS table
CREATE POLICY "orders_select_all" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = salesperson_id::text);

CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE USING (auth.uid()::text = salesperson_id::text);

-- Step 6: Create simple policies for COMMISSION_RATES table
CREATE POLICY "rates_select_all" ON commission_rates
  FOR SELECT USING (true);

-- Step 7: Ensure jacobmyers692@gmail.com is admin (if user exists)
UPDATE users SET role = 'admin' WHERE email = 'jacobmyers692@gmail.com';
