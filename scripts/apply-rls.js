const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.+)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
console.log('Project ref:', projectRef);
console.log('Supabase URL:', supabaseUrl);

// The SQL to execute
const sql = `
-- Allow all authenticated users to view all user profiles
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_view_all" ON users;
CREATE POLICY "users_view_all" ON users FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow viewing user_stats
DROP POLICY IF EXISTS "user_stats_read_own" ON user_stats;
DROP POLICY IF EXISTS "user_stats_view_all" ON user_stats;
CREATE POLICY "user_stats_view_all" ON user_stats FOR SELECT USING (auth.uid() IS NOT NULL);

-- Achievement definitions
DROP POLICY IF EXISTS "achievements_view_all" ON achievement_definitions;
CREATE POLICY "achievements_view_all" ON achievement_definitions FOR SELECT USING (auth.uid() IS NOT NULL);

-- User achievements (view own)
DROP POLICY IF EXISTS "user_achievements_view_own" ON user_achievements;
CREATE POLICY "user_achievements_view_own" ON user_achievements FOR SELECT USING (auth.uid()::text = user_id::text);
`;

console.log('\nSQL to execute:\n', sql);
console.log('\n-----------------------------------');
console.log('To apply this migration, please:');
console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
console.log('2. Paste the SQL above');
console.log('3. Click "Run"');
console.log('-----------------------------------\n');

// Copy SQL to clipboard on Windows
const { execSync } = require('child_process');
try {
  execSync(`echo ${JSON.stringify(sql)} | clip`, { stdio: 'pipe' });
  console.log('SQL has been copied to your clipboard!');
} catch (e) {
  // Clipboard copy failed, that's ok
}
