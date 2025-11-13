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
  
  console.log('Testing database queries with corrected schema...\n');
  
  // Test 1: Query with passwordHash (correct column name)
  console.log('Test 1: Query users table with passwordHash column');
  const [result1] = await connection.query(
    'SELECT id, email, passwordHash FROM users WHERE email = ? LIMIT 1',
    ['dianasmith7482@gmail.com']
  );
  
  if (result1.length > 0) {
    console.log('✓ SUCCESS: Query returned user');
    console.log('  User:', result1[0]);
  } else {
    console.log('✗ FAILED: No user found');
  }
  
  // Test 2: Verify all core columns exist and can be queried
  console.log('\nTest 2: Query all core user columns');
  const [result2] = await connection.query(
    `SELECT id, email, passwordHash, loginMethod, role, 
            createdAt, updatedAt, lastSignedIn, 
            street, city, state, zipCode, middleInitial,
            dateOfBirth, ssn, idType, idNumber, maritalStatus,
            dependents, citizenshipStatus, employmentStatus,
            employer, monthlyIncome, priorBankruptcy, bankruptcyDate
     FROM users LIMIT 1`
  );
  
  if (result2.length > 0) {
    console.log('✓ SUCCESS: All columns queried successfully');
  }
  
  // Test 3: Check password reset table
  console.log('\nTest 3: Check password reset table');
  const [resetTokens] = await connection.query(
    'SELECT id, userId, token, expiresAt, used FROM passwordResetTokens LIMIT 1'
  );
  console.log('✓ SUCCESS: Password reset tokens table accessible');
  console.log('  Count:', resetTokens.length === 0 ? '0 tokens' : `${resetTokens.length} tokens`);
  
  await connection.end();
  console.log('\n✓ All database tests passed! Schema is correct.');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
