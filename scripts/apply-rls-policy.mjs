// Script to apply RLS policy via Supabase API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const policies = [
  // Drop old restrictive policies
  `DROP POLICY IF EXISTS "users_read_own" ON users`,
  `DROP POLICY IF EXISTS "user_stats_read_own" ON user_stats`,

  // Create new permissive policies for viewing
  `DROP POLICY IF EXISTS "users_view_all" ON users`,
  `CREATE POLICY "users_view_all" ON users FOR SELECT USING (auth.uid() IS NOT NULL)`,

  `DROP POLICY IF EXISTS "user_stats_view_all" ON user_stats`,
  `CREATE POLICY "user_stats_view_all" ON user_stats FOR SELECT USING (auth.uid() IS NOT NULL)`,

  // Achievement policies
  `DROP POLICY IF EXISTS "achievements_view_all" ON achievement_definitions`,
  `CREATE POLICY "achievements_view_all" ON achievement_definitions FOR SELECT USING (auth.uid() IS NOT NULL)`,

  `DROP POLICY IF EXISTS "user_achievements_view_own" ON user_achievements`,
  `CREATE POLICY "user_achievements_view_own" ON user_achievements FOR SELECT USING (auth.uid()::text = user_id::text)`,
];

async function applyPolicies() {
  console.log('Applying RLS policies...\n');

  for (const sql of policies) {
    console.log(`Executing: ${sql.substring(0, 60)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // Try alternative method - direct query
      console.log('  RPC failed, this is expected. Policies may need to be applied via Supabase dashboard.');
    } else {
      console.log('  ✓ Success');
    }
  }

  console.log('\nNote: If RPC method failed, please run the SQL in supabase/migrations/20241205000001_allow_users_view_all.sql');
  console.log('directly in the Supabase SQL Editor at: https://supabase.com/dashboard/project/tvgnkxgwcfqeoilrwqjl/sql');
}

applyPolicies();
