import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  uri: 'mysql://3ZrrJMbxK9yUuwj.root:M4iGBMvS4k4cEJANC546@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/SKaMVdMNraqB5VhX78BegA',
  ssl: { rejectUnauthorized: true }
});

const db = drizzle(pool);

// Set a password for the admin
const password = 'Admin123!'; // You can change this
const hashedPassword = await bcrypt.hash(password, 10);

console.log('Setting password for dianasmith6525@gmail.com...');

await db.update(users)
  .set({ 
    password: hashedPassword,
    loginMethod: 'password'
  })
  .where(eq(users.email, 'dianasmith6525@gmail.com'));

const updated = await db.select().from(users).where(eq(users.email, 'dianasmith6525@gmail.com'));
console.log('\nUpdated user:');
console.log('Email:', updated[0].email);
console.log('Name:', updated[0].name);
console.log('Role:', updated[0].role);
console.log('Login Method:', updated[0].loginMethod);
console.log('Has Password:', updated[0].password ? 'Yes' : 'No');
console.log('\n✅ You can now login with:');
console.log('Email: dianasmith6525@gmail.com');
console.log('Password: Admin123!');

await pool.end();
process.exit(0);
