import pg from 'pg';

const connectionString = "postgresql://postgres.sgimfnmtisqkitrghxrx:Olami6525$$@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const { Pool } = pg;
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }  // Allow self-signed certs for testing
});

async function checkColumns() {
  try {
    console.log('🔍 Checking users table columns...\n');
    
    // Get column information
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columns in users table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Try to query the admin user
    console.log('\n🔍 Trying to find admin user...\n');
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      ['diana@amerilendloan.com']
    );
    
    if (userResult.rows.length > 0) {
      console.log('✅ Found admin user:');
      console.log(userResult.rows[0]);
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkColumns();
