#!/usr/bin/env node

import pg from 'pg';

const { Pool } = pg;

const connectionString = 'postgresql://postgres.sgimfnmtisqkitrghxrx:Olami6525$$@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkAdminUser() {
  try {
    console.log('[Check] Connecting to database...');
    
    // Check for admin users
    const result = await pool.query(`
      SELECT id, email, role, name
      FROM users 
      WHERE role = 'admin'
      ORDER BY "createdAt" DESC
    `);
    
    console.log('\n[Admin Users Found]:', result.rows.length);
    result.rows.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Name: ${user.name}`);
      console.log(`    Role: ${user.role}`);
      console.log('');
    });
    
    // Try to find the specific emails
    const emails = ['diana@amerilendloan.com', 'dianasmith6525@gmail.com'];
    for (const email of emails) {
      const check = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
      if (check.rows.length > 0) {
        console.log(`[Found] ${email}:`, check.rows[0]);
      } else {
        console.log(`[Not Found] ${email}`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('[Error]:', error.message);
    process.exit(1);
  }
}

checkAdminUser();
