import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('🔍 Checking for approved loans...\n');
    
    // Get all loans with status counts
    const [loans] = await conn.query(`
      SELECT id, userId, status, approvedAmount, processingFeeAmount, createdAt, email
      FROM loanApplications 
      ORDER BY createdAt DESC
    `);
    
    console.log(`📊 Total loans: ${loans.length}\n`);
    
    // Count by status
    const statusCounts = {};
    loans.forEach(loan => {
      statusCounts[loan.status] = (statusCounts[loan.status] || 0) + 1;
    });
    
    console.log('📈 Loans by Status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');
    
    // Find approved loans
    const approvedLoans = loans.filter(l => l.status === 'approved');
    
    if (approvedLoans.length === 0) {
      console.log('❌ No approved loans found!');
      console.log('\n⚠️  Users should see "Pay Processing Fee" button only when loan status = \'approved\'');
      console.log('\n📋 Recent loan statuses:');
      loans.slice(0, 5).forEach(loan => {
        const amt = (loan.approvedAmount || 0) / 100;
        console.log(`   Loan #${loan.id}: ${loan.status} - $${amt.toFixed(2)} (User: ${loan.userId}, Email: ${loan.email})`);
      });
    } else {
      console.log(`✅ Found ${approvedLoans.length} approved loan(s):\n`);
      
      for (const loan of approvedLoans) {
        const amt = (loan.approvedAmount || 0) / 100;
        const fee = (loan.processingFeeAmount || 0) / 100;
        
        console.log(`   Loan #${loan.id}:`);
        console.log(`      User ID: ${loan.userId}`);
        console.log(`      Email: ${loan.email}`);
        console.log(`      Amount: $${amt.toFixed(2)}`);
        console.log(`      Processing Fee: $${fee.toFixed(2)}`);
        console.log(`      Created: ${loan.createdAt}`);
        console.log(`      Payment Link: /payment/${loan.id}`);
        console.log('');
        
        // Get user details
        const [users] = await conn.query('SELECT email, fullName FROM users WHERE id = ?', [loan.userId]);
        if (users[0]) {
          console.log(`      👤 User: ${users[0].email} (${users[0].fullName || 'No name'})\n`);
        }
      }
      
      console.log('\n💡 These users should see the "Pay Processing Fee" button on their dashboard!');
    }
    
    await conn.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
