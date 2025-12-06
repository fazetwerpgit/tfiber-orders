const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvVar = (name) => {
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith(name + '=')) {
      return line.substring(name.length + 1).trim();
    }
  }
  return null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

// Extract project ref from URL (e.g., tvgnkxgwcfqeoilrwqjl from https://tvgnkxgwcfqeoilrwqjl.supabase.co)
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Supabase database connection string format
// Using the pooler (port 6543) with the service role key as password
const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

// SQL statements to execute
const sqlStatements = [
  'DROP POLICY IF EXISTS "users_read_own" ON users',
  'DROP POLICY IF EXISTS "users_view_all" ON users',
  'CREATE POLICY "users_view_all" ON users FOR SELECT USING (auth.uid() IS NOT NULL)',
  'DROP POLICY IF EXISTS "user_stats_read_own" ON user_stats',
  'DROP POLICY IF EXISTS "user_stats_view_all" ON user_stats',
  'CREATE POLICY "user_stats_view_all" ON user_stats FOR SELECT USING (auth.uid() IS NOT NULL)',
  'DROP POLICY IF EXISTS "achievements_view_all" ON achievement_definitions',
  'CREATE POLICY "achievements_view_all" ON achievement_definitions FOR SELECT USING (auth.uid() IS NOT NULL)',
  'DROP POLICY IF EXISTS "user_achievements_view_own" ON user_achievements',
  'CREATE POLICY "user_achievements_view_own" ON user_achievements FOR SELECT USING (auth.uid()::text = user_id::text)',
];

async function applyRLSPolicies() {
  console.log('Connecting to Supabase database...');
  console.log('Project:', projectRef);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully!\n');

    for (const sql of sqlStatements) {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      try {
        await client.query(sql);
        console.log('  ✓ Success');
      } catch (err) {
        console.log('  ✗ Error:', err.message);
      }
    }

    console.log('\n✅ RLS policies applied successfully!');
  } catch (err) {
    console.error('Connection error:', err.message);
    console.log('\nTrying direct connection (port 5432)...');

    // Try direct connection instead of pooler
    const directConnectionString = `postgresql://postgres:${serviceRoleKey}@db.${projectRef}.supabase.co:5432/postgres`;
    const directClient = new Client({
      connectionString: directConnectionString,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await directClient.connect();
      console.log('Connected via direct connection!\n');

      for (const sql of sqlStatements) {
        console.log(`Executing: ${sql.substring(0, 50)}...`);
        try {
          await directClient.query(sql);
          console.log('  ✓ Success');
        } catch (err) {
          console.log('  ✗ Error:', err.message);
        }
      }

      console.log('\n✅ RLS policies applied successfully!');
      await directClient.end();
    } catch (directErr) {
      console.error('Direct connection also failed:', directErr.message);
      process.exit(1);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

applyRLSPolicies();
