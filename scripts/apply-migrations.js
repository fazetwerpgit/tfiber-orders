// Script to apply migrations directly to Supabase Postgres
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Supabase project details
const PROJECT_REF = 'tvgnkxgwcfqeoilrwqjl';

// Read database password from .env.local (it's the service role key, but we need the DB password)
// For Supabase, the postgres password is in the dashboard under Settings > Database
// But we can try using the pooler connection with service role

// Supabase connection string format:
// Direct: postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
// Pooler: postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

// Read .env.local for any database URL
function getEnvVar(name) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`${name}=(.+)`);
    const match = envContent.match(regex);
    return match ? match[1].trim() : null;
  } catch (e) {
    return null;
  }
}

async function applyMigrations() {
  console.log('T-Fiber Gamification Migration Script');
  console.log('=====================================\n');

  // Check for DATABASE_URL first
  let connectionString = getEnvVar('DATABASE_URL');

  if (!connectionString) {
    // Try to construct from what we have
    const dbPassword = getEnvVar('SUPABASE_DB_PASSWORD');

    if (dbPassword) {
      // Session pooler connection to Supabase
      connectionString = `postgresql://postgres.${PROJECT_REF}:${dbPassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
    }
  }

  if (!connectionString) {
    console.log('No database connection found in .env.local');
    console.log('\nTo run migrations automatically, add one of these to your .env.local:\n');
    console.log('Option 1 - Full DATABASE_URL:');
    console.log('  DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres\n');
    console.log('Option 2 - Just the password:');
    console.log('  SUPABASE_DB_PASSWORD=your_database_password\n');
    console.log('You can find your database password in:');
    console.log('  Supabase Dashboard > Settings > Database > Connection string\n');
    console.log('---');
    console.log('Or run the SQL manually:');
    console.log('  1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
    console.log('  2. Paste contents of: supabase/apply_all_gamification_migrations.sql');
    console.log('  3. Click Run');
    return;
  }

  console.log('Connecting to Supabase database...');

  // Disable SSL cert verification for Supabase
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const client = new Client({
    connectionString,
    ssl: true,
  });

  try {
    await client.connect();
    console.log('Connected successfully!\n');

    // Read migration file - use the cleaner essential migrations
    const migrationPath = path.join(__dirname, '..', 'supabase', 'essential_migrations.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`Applying migrations (${sql.length} characters)...`);
    console.log('This may take a moment...\n');

    // Execute the entire SQL file as one transaction
    await client.query(sql);

    console.log('✅ Migrations applied successfully!');
    console.log('\nAll gamification tables and seed data have been created.');

  } catch (error) {
    console.error('❌ Error applying migrations:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\nNote: Some objects already exist, which is usually fine.');
      console.log('The migration uses IF NOT EXISTS for most statements.');
    }

    if (error.message.includes('password authentication failed')) {
      console.log('\nThe database password appears to be incorrect.');
      console.log('Please check your DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local');
    }

  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

applyMigrations().catch(console.error);
