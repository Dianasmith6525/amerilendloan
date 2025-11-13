import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}

try {
  // Parse the connection URL
  const match = DATABASE_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/);
  if (!match) {
    console.error('Invalid DATABASE_URL format');
    process.exit(1);
  }

  const [, user, password, host, database] = match;

  const connection = await mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    ssl: { rejectUnauthorized: true }
  });

  console.log('✅ Connected to database\n');

  // Get table structure
  const [columns] = await connection.query('DESCRIBE users');
  
  console.log('📋 Users table columns:');
  console.log('─'.repeat(80));
  columns.forEach(col => {
    console.log(`${col.Field.padEnd(25)} | ${col.Type.padEnd(20)} | ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  console.log('─'.repeat(80));
  console.log(`\nTotal columns: ${columns.length}`);

  await connection.end();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
