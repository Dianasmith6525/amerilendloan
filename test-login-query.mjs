#!/usr/bin/env node

import pg from 'pg';

const { Pool } = pg;

const connectionString = 'postgresql://postgres.sgimfnmtisqkitrghxrx:Olami6525$$@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testQuery() {
  try {
    console.log('[Test] Connecting to database...');
    
    // Run the exact query that's failing
    const result = await pool.query(
      `select "id", "openId", "name", "email", "phone", "passwordHash", "loginMethod", "role", "createdAt", "updatedAt", "lastSignedIn", "street", "city", "state", "zipCode", "middleInitial", "dateOfBirth", "ssn", "idType", "idNumber", "maritalStatus", "dependents", "citizenshipStatus", "employmentStatus", "employer", "monthlyIncome", "priorBankruptcy", "bankruptcyDate" from "users" where "users"."email" = $1 limit $2`,
      ['diana@amerilendloan.com', 1]
    );
    
    console.log('[Success] Query returned', result.rows.length, 'rows');
    if (result.rows.length > 0) {
      console.log('[User Found]:', {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name,
        role: result.rows[0].role,
        passwordHash: result.rows[0].passwordHash ? '(hashed)' : null
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('[Error]:', error.message);
    console.error('[Full Error]:', error);
    process.exit(1);
  }
}

testQuery();
