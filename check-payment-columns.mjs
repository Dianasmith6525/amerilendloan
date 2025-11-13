import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('=== Payments table columns ===');
    const [columns] = await conn.query(`SHOW COLUMNS FROM payments`);
    console.table(columns);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
