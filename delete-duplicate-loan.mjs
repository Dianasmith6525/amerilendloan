import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('=== Deleting loan application ID 2 ===');
    const [result] = await conn.query('DELETE FROM loanApplications WHERE id = 2');
    console.log('✓ Deleted:', result.affectedRows, 'row(s)');
    
    console.log('\n=== Remaining loans ===');
    const [loans] = await conn.query(`
      SELECT id, userId, referenceNumber, email, status, createdAt 
      FROM loanApplications 
      ORDER BY createdAt DESC
    `);
    console.table(loans);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
