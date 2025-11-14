import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testLoginFlow() {
  try {
    console.log("Testing login flow...");
    
    // Test 1: Query for user
    console.log("\n[Test 1] Querying for user diana@amerilendloan.com...");
    const query1 = `
      SELECT id, "openId", name, email, phone, "passwordHash", "loginMethod", role, 
             "createdAt", "updatedAt", "lastSignedIn"
      FROM users
      WHERE email = $1
      LIMIT 1
    `;
    const result1 = await pool.query(query1, ['diana@amerilendloan.com']);
    console.log(`✓ Query succeeded, rows: ${result1.rows.length}`);
    
    if (result1.rows.length === 0) {
      console.log("❌ User not found!");
      return;
    }
    
    const user = result1.rows[0];
    console.log("\nUser data:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Password Hash Length: ${user.passwordHash ? user.passwordHash.length : 'NULL'}`);
    console.log(`  Password Hash Exists: ${!!user.passwordHash}`);
    console.log(`  Password Hash First 20 chars: ${user.passwordHash ? user.passwordHash.substring(0, 20) : 'N/A'}`);
    console.log(`  Login Method: ${user.loginMethod}`);
    
    // Test 2: Check if we can import bcrypt
    console.log("\n[Test 2] Attempting bcrypt comparison...");
    try {
      const bcrypt = await import('bcryptjs');
      const password = 'Admin123!';
      console.log(`  Input password: ${password}`);
      console.log(`  Hash to compare: ${user.passwordHash}`);
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log(`  ✓ bcrypt.compare succeeded: ${isValid}`);
      
      if (!isValid) {
        console.log("  ❌ Password does not match!");
        console.log("  Trying to understand why...");
        
        // Let's try creating a hash to see what a valid bcrypt hash looks like
        const hash = await bcrypt.hash(password, 10);
        console.log(`  Fresh hash of '${password}': ${hash}`);
        console.log(`  Fresh hash length: ${hash.length}`);
        console.log(`  Stored hash length: ${user.passwordHash.length}`);
      }
    } catch (bcryptError) {
      console.log(`  ❌ Bcrypt error: ${bcryptError.message}`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testLoginFlow();
