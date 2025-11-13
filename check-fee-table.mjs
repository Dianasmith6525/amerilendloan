import mysql from 'mysql2/promise';
import 'dotenv/config';

async function checkFeeTable() {
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    console.log('\n=== Checking Fee Configuration Table ===\n');

    // Check if table exists
    const [tables] = await conn.query(`SHOW TABLES LIKE 'fee%'`);
    console.log('Fee-related tables:', tables);

    // Try to query the table
    try {
      const [config] = await conn.query('SELECT * FROM feeConfiguration LIMIT 1');
      console.log('\nfeeConfiguration table data:', config);
    } catch (error) {
      console.error('\nError querying feeConfiguration:', error.message);
      
      // Check if it might be fee_configuration instead
      try {
        const [config2] = await conn.query('SELECT * FROM fee_configuration LIMIT 1');
        console.log('\nfee_configuration table data:', config2);
      } catch (error2) {
        console.error('Error querying fee_configuration:', error2.message);
      }
    }

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

checkFeeTable();
