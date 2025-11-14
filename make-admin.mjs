import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres.sgimfnmtisqkitrghxrx:Olami6525$$@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const adminEmail = 'diana@amerilendloan.com';

async function makeAdmin() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('[Admin Setup] Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('[Admin Setup] Connected!');

    // Update user to admin role
    const result = await client.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, first_name, last_name, role',
      ['admin', adminEmail]
    );

    if (result.rows.length > 0) {
      console.log('\n✅ User updated to admin successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email: ${result.rows[0].email}`);
      console.log(`Name: ${result.rows[0].first_name} ${result.rows[0].last_name}`);
      console.log(`Role: ${result.rows[0].role}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('\n❌ User not found!');
      console.log('Please signup first at: https://www.amerilendloan.com/signup\n');
    }

  } catch (error) {
    console.error('[Admin Setup] Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

makeAdmin();
