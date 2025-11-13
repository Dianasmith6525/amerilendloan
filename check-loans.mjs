import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('=== Recent loan applications ===');
    const [loans] = await conn.query(`
      SELECT id, userId, referenceNumber, email, status, createdAt 
      FROM loanApplications 
      ORDER BY createdAt DESC 
      LIMIT 5
    `);
    console.table(loans);
    
    console.log('\n=== Checking user 540001 loans ===');
    const [userLoans] = await conn.query(`
      SELECT id, userId, referenceNumber, email, status, createdAt 
      FROM loanApplications 
      WHERE userId = 540001
      ORDER BY createdAt DESC
    `);
    console.table(userLoans);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
