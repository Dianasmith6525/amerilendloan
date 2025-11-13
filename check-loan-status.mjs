import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('🔍 Checking loan #1 details...\n');
    
    // Get loan #1 details
    const [loans] = await conn.query(`
      SELECT id, userId, status, approvedAmount, processingFeeAmount, createdAt, updatedAt, email
      FROM loanApplications 
      WHERE id = 1
    `);
    
    if (loans.length === 0) {
      console.log('❌ Loan #1 not found!');
      await conn.end();
      return;
    }
    
    const loan = loans[0];
    
    console.log('📋 Loan #1 Details:');
    console.log('   ID:', loan.id);
    console.log('   User ID:', loan.userId);
    console.log('   Email:', loan.email);
    console.log('   Status:', loan.status);
    console.log('   Approved Amount:', loan.approvedAmount ? `$${(loan.approvedAmount / 100).toFixed(2)}` : 'Not set');
    console.log('   Processing Fee:', loan.processingFeeAmount ? `$${(loan.processingFeeAmount / 100).toFixed(2)}` : 'Not set');
    console.log('   Created:', loan.createdAt);
    console.log('   Updated:', loan.updatedAt);
    console.log('');
    
    // Check if status allows payment
    if (loan.status === 'approved' || loan.status === 'fee_pending') {
      console.log('✅ Status allows payment page access');
      console.log('   Payment URL: /payment/1');
    } else {
      console.log('❌ Status does NOT allow payment!');
      console.log('   Current status:', loan.status);
      console.log('   Expected: "approved" or "fee_pending"');
      console.log('');
      console.log('💡 Need to update loan status to "approved" or "fee_pending"');
    }
    
    await conn.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
