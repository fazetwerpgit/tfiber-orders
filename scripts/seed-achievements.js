// Script to seed achievements in the database
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

async function seedAchievements() {
  console.log('T-Fiber Achievement Seeding Script');
  console.log('===================================\n');

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

    // Clear existing achievements to prevent duplicates
    console.log('Clearing existing achievements...');
    await client.query('DELETE FROM user_achievements');
    await client.query('DELETE FROM achievements');

    // Insert comprehensive achievements
    const achievements = [
      // Sales Count Milestones
      { name: 'first_sale', display_name: 'First Sale', description: 'Complete your first sale', icon: '🎯', category: 'milestone', points_reward: 50, condition_type: 'sales_count', condition_value: 1, sort_order: 1 },
      { name: 'three_sales', display_name: 'Hat Trick', description: 'Complete 3 sales', icon: '🎩', category: 'milestone', points_reward: 75, condition_type: 'sales_count', condition_value: 3, sort_order: 2 },
      { name: 'five_sales', display_name: 'High Five', description: 'Complete 5 sales', icon: '🖐️', category: 'milestone', points_reward: 100, condition_type: 'sales_count', condition_value: 5, sort_order: 3 },
      { name: 'ten_sales', display_name: 'Double Digits', description: 'Complete 10 sales', icon: '🔟', category: 'milestone', points_reward: 200, condition_type: 'sales_count', condition_value: 10, sort_order: 4 },
      { name: 'twenty_five_sales', display_name: 'Quarter Century', description: 'Complete 25 sales', icon: '🏅', category: 'milestone', points_reward: 500, condition_type: 'sales_count', condition_value: 25, sort_order: 5 },
      { name: 'fifty_sales', display_name: 'Half Century', description: 'Complete 50 sales', icon: '🥇', category: 'milestone', points_reward: 1000, condition_type: 'sales_count', condition_value: 50, sort_order: 6 },
      { name: 'hundred_sales', display_name: 'Century Club', description: 'Complete 100 sales', icon: '💯', category: 'milestone', points_reward: 2500, condition_type: 'sales_count', condition_value: 100, sort_order: 7 },
      { name: 'two_fifty_sales', display_name: 'Sales Legend', description: 'Complete 250 sales', icon: '🌟', category: 'milestone', points_reward: 5000, condition_type: 'sales_count', condition_value: 250, sort_order: 8 },
      { name: 'five_hundred_sales', display_name: 'Sales Master', description: 'Complete 500 sales', icon: '👑', category: 'milestone', points_reward: 10000, condition_type: 'sales_count', condition_value: 500, sort_order: 9 },

      // Streak Achievements
      { name: 'streak_3', display_name: 'On a Roll', description: '3-day sales streak', icon: '🔥', category: 'streak', points_reward: 25, condition_type: 'sales_streak', condition_value: 3, sort_order: 20 },
      { name: 'streak_5', display_name: 'Heating Up', description: '5-day sales streak', icon: '⚡', category: 'streak', points_reward: 50, condition_type: 'sales_streak', condition_value: 5, sort_order: 21 },
      { name: 'streak_7', display_name: 'Week Warrior', description: '7-day sales streak', icon: '💪', category: 'streak', points_reward: 100, condition_type: 'sales_streak', condition_value: 7, sort_order: 22 },
      { name: 'streak_14', display_name: 'Fortnight Fighter', description: '14-day sales streak', icon: '🗡️', category: 'streak', points_reward: 250, condition_type: 'sales_streak', condition_value: 14, sort_order: 23 },
      { name: 'streak_21', display_name: 'Triple Week', description: '21-day sales streak', icon: '🏆', category: 'streak', points_reward: 500, condition_type: 'sales_streak', condition_value: 21, sort_order: 24 },
      { name: 'streak_30', display_name: 'Monthly Master', description: '30-day sales streak', icon: '👑', category: 'streak', points_reward: 1000, condition_type: 'sales_streak', condition_value: 30, sort_order: 25 },

      // Points Achievements
      { name: 'points_100', display_name: 'Point Starter', description: 'Earn 100 total points', icon: '⭐', category: 'points', points_reward: 25, condition_type: 'points_total', condition_value: 100, sort_order: 40 },
      { name: 'points_500', display_name: 'Point Collector', description: 'Earn 500 total points', icon: '🌟', category: 'points', points_reward: 50, condition_type: 'points_total', condition_value: 500, sort_order: 41 },
      { name: 'points_1000', display_name: 'Point Hoarder', description: 'Earn 1,000 total points', icon: '✨', category: 'points', points_reward: 100, condition_type: 'points_total', condition_value: 1000, sort_order: 42 },
      { name: 'points_2500', display_name: 'Point Expert', description: 'Earn 2,500 total points', icon: '💫', category: 'points', points_reward: 250, condition_type: 'points_total', condition_value: 2500, sort_order: 43 },
      { name: 'points_5000', display_name: 'Point Master', description: 'Earn 5,000 total points', icon: '🔮', category: 'points', points_reward: 500, condition_type: 'points_total', condition_value: 5000, sort_order: 44 },
      { name: 'points_10000', display_name: 'Point Legend', description: 'Earn 10,000 total points', icon: '💎', category: 'points', points_reward: 1000, condition_type: 'points_total', condition_value: 10000, sort_order: 45 },

      // Special Daily Achievements
      { name: 'daily_warrior', display_name: 'Daily Warrior', description: 'Make a sale every day for a week', icon: '⚔️', category: 'special', points_reward: 150, condition_type: 'sales_streak', condition_value: 7, sort_order: 60 },
      { name: 'early_bird', display_name: 'Early Bird', description: 'First sale of the day before 9 AM', icon: '🐦', category: 'special', points_reward: 25, condition_type: 'custom', condition_value: 0, sort_order: 61 },
      { name: 'night_owl', display_name: 'Night Owl', description: 'Make a sale after 8 PM', icon: '🦉', category: 'special', points_reward: 25, condition_type: 'custom', condition_value: 0, sort_order: 62 },
      { name: 'weekend_warrior', display_name: 'Weekend Warrior', description: 'Make sales on both Saturday and Sunday', icon: '🎉', category: 'special', points_reward: 50, condition_type: 'custom', condition_value: 0, sort_order: 63 },
    ];

    console.log(`Inserting ${achievements.length} achievements...`);

    for (const ach of achievements) {
      await client.query(`
        INSERT INTO achievements (name, display_name, description, icon, category, points_reward, condition_type, condition_value, is_active, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
        ON CONFLICT (name) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          category = EXCLUDED.category,
          points_reward = EXCLUDED.points_reward,
          condition_type = EXCLUDED.condition_type,
          condition_value = EXCLUDED.condition_value,
          sort_order = EXCLUDED.sort_order
      `, [ach.name, ach.display_name, ach.description, ach.icon, ach.category, ach.points_reward, ach.condition_type, ach.condition_value, ach.sort_order]);
    }

    console.log('✅ All achievements inserted!\n');

    // Verify
    const result = await client.query('SELECT COUNT(*) FROM achievements');
    console.log(`Total achievements in database: ${result.rows[0].count}`);

    // List them
    const list = await client.query('SELECT name, display_name, icon, points_reward, condition_type, condition_value FROM achievements ORDER BY sort_order');
    console.log('\nAchievements:');
    for (const row of list.rows) {
      console.log(`  ${row.icon} ${row.display_name} - ${row.condition_type} >= ${row.condition_value} (+${row.points_reward} pts)`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

seedAchievements().catch(console.error);
