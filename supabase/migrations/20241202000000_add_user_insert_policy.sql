CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid()::text = id::text);
