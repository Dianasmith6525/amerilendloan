import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('=== Checking for duplicate applications ===\n');
    
    // Find users with multiple applications
    const [duplicates] = await conn.query(`
      SELECT 
        userId,
        email,
        COUNT(*) as application_count,
        GROUP_CONCAT(id ORDER BY id) as loan_ids,
        GROUP_CONCAT(status ORDER BY id) as statuses,
        GROUP_CONCAT(referenceNumber ORDER BY id) as reference_numbers,
        GROUP_CONCAT(createdAt ORDER BY id) as created_dates
      FROM loanApplications
      GROUP BY userId, email
      HAVING COUNT(*) > 1
      ORDER BY application_count DESC
    `);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate applications found!');
    } else {
      console.log(`⚠️ Found ${duplicates.length} user(s) with multiple applications:\n`);
      console.table(duplicates);
      
      console.log('\n=== Detailed view of duplicate applications ===\n');
      for (const dup of duplicates) {
        console.log(`\n👤 User ID: ${dup.userId} | Email: ${dup.email}`);
        console.log(`   Total Applications: ${dup.application_count}`);
        
        const [apps] = await conn.query(`
          SELECT id, userId, referenceNumber, status, createdAt, updatedAt
          FROM loanApplications
          WHERE userId = ?
          ORDER BY createdAt ASC
        `, [dup.userId]);
        
        console.table(apps);
      }
    }
    
    console.log('\n=== All loan applications summary ===');
    const [all] = await conn.query(`
      SELECT id, userId, email, referenceNumber, status, createdAt
      FROM loanApplications
      ORDER BY createdAt DESC
    `);
    console.table(all);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
