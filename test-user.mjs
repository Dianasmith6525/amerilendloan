import mysql from 'mysql2/promise';

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);
const config = {
  host: url.hostname,
  port: url.port || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: {
    rejectUnauthorized: false
  }
};

try {
  const connection = await mysql.createConnection(config);
  
  // Check if a user exists
  const [users] = await connection.query('SELECT id, email, passwordHash FROM users WHERE email = ? LIMIT 1', ['dianasmith7482@gmail.com']);
  if (users.length > 0) {
    console.log('✓ User found:', users[0]);
  } else {
    console.log('✗ No user found with that email');
    
    // Check all users
    const [allUsers] = await connection.query('SELECT id, email FROM users LIMIT 5');
    console.log('\nFirst 5 users in database:');
    allUsers.forEach(u => console.log(`  - ${u.email}`));
  }
  
  await connection.end();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
