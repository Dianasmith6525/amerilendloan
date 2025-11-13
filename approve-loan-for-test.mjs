import 'dotenv/config';
import mysql from 'mysql2/promise';

async function approveLoanForPaymentTest() {
  try {
    console.log('[Test] Connecting to database...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    const loanId = 1; // The pending loan
    const approvedAmount = 1000000; // $10,000 in cents
    const processingFeeAmount = 50000; // $500 in cents (5% fee)
    
    console.log('\n[Test] Approving loan for payment test...');
    
    // Update loan status to approved
    await connection.execute(`
      UPDATE loanApplications
      SET 
        status = 'approved',
        approvedAmount = ?,
        processingFeeAmount = ?,
        processingFeePaid = 0
      WHERE id = ?
    `, [approvedAmount, processingFeeAmount, loanId]);
    
    console.log('✅ Loan approved successfully!');
    console.log(`   Loan ID: ${loanId}`);
    console.log(`   Approved Amount: $${(approvedAmount / 100).toFixed(2)}`);
    console.log(`   Processing Fee: $${(processingFeeAmount / 100).toFixed(2)}`);
    
    // Verify the update
    const [updated] = await connection.execute(`
      SELECT 
        id,
        referenceNumber,
        status,
        approvedAmount,
        processingFeeAmount,
        processingFeePaid
      FROM loanApplications
      WHERE id = ?
    `, [loanId]);
    
    console.log('\n📋 Updated Loan Details:');
    console.table(updated);
    
    console.log('\n🎯 Next Steps to Test Payment:');
    console.log('1. Log in as user: dianasmith7482@gmail.com');
    console.log('2. Go to Dashboard: http://localhost:5173/dashboard');
    console.log('3. You should see "Pay Processing Fee" button');
    console.log(`4. Or go directly to: http://localhost:5173/payment/${loanId}`);
    console.log('\n💳 Test Credit Card (Authorize.Net Sandbox):');
    console.log('   Card Number: 4111111111111111');
    console.log('   Expiry: Any future date (e.g., 12/2025)');
    console.log('   CVV: 123');
    console.log('   Name: Test User');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

approveLoanForPaymentTest();
