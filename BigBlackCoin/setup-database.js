import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function setupDatabase() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });

  try {
    console.log('🚀 Setting up BigBlackCoin Casino database...');

    // Create admin user
    const adminResult = await pool.query(`
      INSERT INTO users (username, password, coin_balance, bbc_balance, is_admin, is_banned, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        coin_balance = EXCLUDED.coin_balance,
        bbc_balance = EXCLUDED.bbc_balance,
        is_admin = EXCLUDED.is_admin
      RETURNING id, username;
    `, ['admin', 'admin1234', '999999.00', '999.00000000', true, false]);

    console.log('✅ Admin user created:', adminResult.rows[0]);

    // Create sample player
    const playerResult = await pool.query(`
      INSERT INTO users (username, password, coin_balance, bbc_balance, is_admin, is_banned, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (username) DO UPDATE SET
        password = EXCLUDED.password,
        coin_balance = EXCLUDED.coin_balance,
        bbc_balance = EXCLUDED.bbc_balance
      RETURNING id, username;
    `, ['player1', 'password123', '12450.75', '2.35000000', false, false]);

    console.log('✅ Sample player created:', playerResult.rows[0]);

    console.log('🎯 Database setup complete! You can now login with:');
    console.log('   Admin: admin / admin1234');
    console.log('   Player: player1 / password123');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();