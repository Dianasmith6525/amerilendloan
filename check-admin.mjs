import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const pool = mysql.createPool({
  uri: 'mysql://3ZrrJMbxK9yUuwj.root:M4iGBMvS4k4cEJANC546@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/SKaMVdMNraqB5VhX78BegA',
  ssl: { rejectUnauthorized: true }
});
const db = drizzle(pool);

const user = await db.select().from(users).where(eq(users.email, 'dianasmith6525@gmail.com'));
console.log('Current user:', JSON.stringify(user, null, 2));

if (user.length > 0) {
  console.log('\nUpdating user role to admin...');
  await db.update(users)
    .set({ role: 'admin' })
    .where(eq(users.email, 'dianasmith6525@gmail.com'));
  
  const updated = await db.select().from(users).where(eq(users.email, 'dianasmith6525@gmail.com'));
  console.log('Updated user:', JSON.stringify(updated, null, 2));
} else {
  console.log('\nUser not found. They need to sign up first.');
}

await pool.end();
process.exit(0);
