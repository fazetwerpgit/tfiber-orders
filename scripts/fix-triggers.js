// Script to check and fix database triggers
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PROJECT_REF = 'tvgnkxgwcfqeoilrwqjl';

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

async function fixTriggers() {
  console.log('T-Fiber Trigger Fix Script');
  console.log('==========================\n');

  const dbPassword = getEnvVar('SUPABASE_DB_PASSWORD');
  if (!dbPassword) {
    console.log('No SUPABASE_DB_PASSWORD found in .env.local');
    return;
  }

  const connectionString = `postgresql://postgres.${PROJECT_REF}:${dbPassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const client = new Client({
    connectionString,
    ssl: true,
  });

  try {
    await client.connect();
    console.log('Connected successfully!\n');

    // First, check what triggers exist on the orders table
    console.log('Checking for triggers on orders table...');
    const triggersResult = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'orders'
      ORDER BY trigger_name;
    `);

    if (triggersResult.rows.length === 0) {
      console.log('No triggers found on orders table.');
    } else {
      console.log('Found triggers:');
      for (const row of triggersResult.rows) {
        console.log(`  - ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`);
      }
    }

    // Drop ALL problematic triggers that might reference points
    console.log('\nDropping problematic triggers...');

    const dropTriggers = `
      -- Drop triggers that might reference non-existent columns
      DROP TRIGGER IF EXISTS award_points_after_order_insert ON orders;
      DROP TRIGGER IF EXISTS award_points_after_order_status_change ON orders;
      DROP TRIGGER IF EXISTS create_activity_on_order ON orders;
      DROP TRIGGER IF EXISTS order_points_trigger ON orders;
      DROP TRIGGER IF EXISTS trigger_update_user_stats ON orders;
      DROP TRIGGER IF EXISTS challenge_progress_trigger ON orders;

      -- Drop related functions
      DROP FUNCTION IF EXISTS award_points_on_order() CASCADE;
      DROP FUNCTION IF EXISTS handle_order_status_change() CASCADE;
      DROP FUNCTION IF EXISTS create_order_activity() CASCADE;
      DROP FUNCTION IF EXISTS handle_order_points() CASCADE;
      DROP FUNCTION IF EXISTS update_user_stats() CASCADE;
      DROP FUNCTION IF EXISTS update_challenge_progress() CASCADE;
    `;

    await client.query(dropTriggers);
    console.log('✅ Dropped problematic triggers and functions.');

    // Check what triggers remain
    console.log('\nChecking remaining triggers...');
    const remainingResult = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'orders'
      ORDER BY trigger_name;
    `);

    if (remainingResult.rows.length === 0) {
      console.log('No triggers remain on orders table.');
    } else {
      console.log('Remaining triggers (these should be safe):');
      for (const row of remainingResult.rows) {
        console.log(`  - ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`);
      }
    }

    console.log('\n✅ Fix complete! Try submitting an order now.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

fixTriggers().catch(console.error);
