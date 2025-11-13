import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

console.log("Connected to database\n");

// Check all users
const [users] = await connection.query('SELECT id, email, name, role FROM users ORDER BY id');
console.log(`Total Users: ${users.length}`);
console.log("\nUser Details:");
users.forEach(user => {
  console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
});

// Check loans with user info
const [loans] = await connection.query(`
  SELECT l.id, l.userId, u.email, u.name, l.status, l.referenceNumber 
  FROM loanApplications l 
  LEFT JOIN users u ON l.userId = u.id
  ORDER BY l.id
`);
console.log(`\nTotal Loans: ${loans.length}`);
console.log("\nLoan Details:");
loans.forEach(loan => {
  console.log(`  Loan ID: ${loan.id}, User ID: ${loan.userId}, User: ${loan.name} (${loan.email}), Status: ${loan.status}, Ref: ${loan.referenceNumber}`);
});

await connection.end();
