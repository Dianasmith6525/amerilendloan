import 'dotenv/config';
import mysql from 'mysql2/promise';

async function testAdminQueries() {
  try {
    console.log('[Test] Connecting to database...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Test 1: Get all loan applications
    console.log('\n[Test 1] Fetching loan applications...');
    const [loans] = await connection.execute('SELECT COUNT(*) as count FROM loanApplications');
    console.log('✓ Loan applications count:', loans[0].count);
    
    // Test 2: Get all payments
    console.log('\n[Test 2] Fetching payments...');
    const [paymentsResult] = await connection.execute('SELECT COUNT(*) as count FROM payments');
    console.log('✓ Payments count:', paymentsResult[0].count);
    
    // Test 3: Get all users
    console.log('\n[Test 3] Fetching users...');
    const [usersResult] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('✓ Users count:', usersResult[0].count);
    
    // Test 4: Get payment stats
    console.log('\n[Test 4] Calculating payment stats...');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as succeeded,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(amount) as totalAmount,
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as succeededAmount
      FROM payments
    `);
    console.log('✓ Payment stats:', stats[0]);
    
    // Test 5: Get loan stats
    console.log('\n[Test 5] Calculating loan stats...');
    const [loanStats] = await connection.execute(`
      SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN status IN ('pending', 'under_review') THEN 1 ELSE 0 END) as pendingApplications,
        SUM(CASE WHEN status IN ('approved', 'fee_paid', 'disbursed') THEN 1 ELSE 0 END) as approvedLoans,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedLoans,
        SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) as disbursedLoans
      FROM loanApplications
    `);
    console.log('✓ Loan stats:', loanStats[0]);
    
    console.log('\n✅ All database queries working correctly!');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL Message:', error.sqlMessage);
    }
  }
}

testAdminQueries();
