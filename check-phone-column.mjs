import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('Checking phone column in users table...\n');
    
    const columnsResult = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'users' 
       ORDER BY ordinal_position`
    );
    
    console.log('All columns in users table:');
    columnsResult.rows.forEach(row => {
      const hasPhone = row.column_name === 'phone' || row.column_name === 'phoneNumber';
      const marker = hasPhone ? '📱' : '  ';
      console.log(`  ${marker} ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    const hasPhone = columnsResult.rows.some(r => r.column_name === 'phone' || r.column_name === 'phoneNumber');
    console.log(`\n${hasPhone ? '✅ Phone column EXISTS' : '❌ Phone column MISSING'}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
