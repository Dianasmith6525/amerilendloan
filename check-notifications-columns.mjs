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
    console.log('Getting notifications table structure...\n');
    
    // Get columns
    const columnsResult = await pool.query(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'notifications' 
       ORDER BY ordinal_position`
    );
    
    console.log('Columns in notifications table:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Get sample row
    console.log('\nSample notification record:');
    const sampleResult = await pool.query('SELECT * FROM notifications LIMIT 1');
    if (sampleResult.rows.length > 0) {
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    } else {
      console.log('  (no records in table)');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
