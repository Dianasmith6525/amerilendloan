import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse the connection string
const url = new URL(connectionString);
const config = {
  host: url.hostname,
  port: url.port || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

try {
  const connection = await mysql.createConnection(config);
  
  console.log('Connected to database');
  console.log(`Database: ${config.database}`);
  console.log('\n=== USERS TABLE STRUCTURE ===\n');
  
  const [columns] = await connection.query('DESCRIBE users');
  console.table(columns);
  
  await connection.end();
  console.log('\nColumns found in users table:');
  columns.forEach(col => console.log(`  - ${col.Field}`));
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
