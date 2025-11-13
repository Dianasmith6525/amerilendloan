import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      }
    });
    
    // Get all tables
    const [tables] = await conn.query("SHOW TABLES");
    console.log('All tables in database:');
    console.log(tables);
    
    // Check for notification-related tables
    const [notificationTables] = await conn.query("SHOW TABLES LIKE '%notification%'");
    console.log('\nNotification-related tables:');
    console.log(notificationTables);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
