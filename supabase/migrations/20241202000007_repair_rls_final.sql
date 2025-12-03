-- FINAL RLS REPAIR - Drop ALL policies and recreate clean ones
-- This fixes the infinite recursion error

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop ALL policies on users table (any possible name)
DROP POLICY IF EXISTS "Admins and managers can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Drop ALL policies on orders table
DROP POLICY IF EXISTS "Admins and managers can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update any order" ON orders;
DROP POLICY IF EXISTS "Salespeople can view their own orders" ON orders;
DROP POLICY IF EXISTS "Salespeople can insert orders" ON orders;
DROP POLICY IF EXISTS "Salespeople can update their own orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "orders_select_all" ON orders;
DROP POLICY IF EXISTS "orders_insert_own" ON orders;
DROP POLICY IF EXISTS "orders_update_own" ON orders;

-- Drop ALL policies on commission_rates table
DROP POLICY IF EXISTS "Only admins can update commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Anyone can view commission rates" ON commission_rates;
DROP POLICY IF EXISTS "Anyone can view rates" ON commission_rates;
DROP POLICY IF EXISTS "rates_select_all" ON commission_rates;

-- ============================================
-- STEP 2: CREATE NEW SIMPLE POLICIES
-- ============================================

-- USERS: Users can only see/edit their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "users_create_own" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "users_edit_own" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- ORDERS: All authenticated users can view orders, but only create/edit their own
CREATE POLICY "orders_view_all" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_create_own" ON orders
  FOR INSERT WITH CHECK (auth.uid()::text = salesperson_id::text);

CREATE POLICY "orders_edit_own" ON orders
  FOR UPDATE USING (auth.uid()::text = salesperson_id::text);

-- COMMISSION_RATES: Everyone can view, no one can edit via RLS (admin client handles this)
CREATE POLICY "rates_view_all" ON commission_rates
  FOR SELECT USING (true);

-- ============================================
-- STEP 3: SET ADMIN ROLE
-- ============================================

UPDATE users SET role = 'admin' WHERE email = 'jacobmyers692@gmail.com';
