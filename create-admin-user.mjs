import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.sgimfnmtisqkitrghxrx:Olami6525$$@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

async function createAdminUser() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('[Admin Setup] Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('[Admin Setup] Connected!');

    // Admin credentials
    const adminEmail = 'diana@amerilendloan.com';
    const adminPassword = 'Admin123!'; // Change this to your preferred password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin already exists
    const checkResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (checkResult.rows.length > 0) {
      console.log('[Admin Setup] Admin user already exists!');
      console.log('[Admin Setup] Updating to admin role...');
      
      await client.query(
        'UPDATE users SET role = $1, "passwordHash" = $2 WHERE email = $3',
        ['admin', hashedPassword, adminEmail]
      );
      
      console.log('\n✅ Admin user updated successfully!');
    } else {
      console.log('[Admin Setup] Creating new admin user...');
      
      await client.query(
        `INSERT INTO users (email, "passwordHash", name, role, "createdAt", "updatedAt", "lastSignedIn")
         VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())`,
        [adminEmail, hashedPassword, 'Diana Smith', 'admin']
      );
      
      console.log('\n✅ Admin user created successfully!');
    }

    console.log('\n📧 Admin Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Please change this password after first login!');
    console.log('🌐 Login at: https://www.amerilendloan.com/login\n');

  } catch (error) {
    console.error('[Admin Setup] Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdminUser();
