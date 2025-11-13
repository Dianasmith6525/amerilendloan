import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('🔍 Checking what data PaymentPage needs...\n');
    
    // Get loan #1 with all fields
    const [loans] = await conn.query(`
      SELECT * FROM loanApplications WHERE id = 1
    `);
    
    if (loans.length === 0) {
      console.log('❌ Loan #1 not found!');
      await conn.end();
      return;
    }
    
    const loan = loans[0];
    
    console.log('📋 Full Loan Data for ID #1:');
    console.log(JSON.stringify(loan, null, 2));
    console.log('');
    
    // Check specific conditions
    console.log('🔍 PaymentPage.tsx Condition Checks:');
    console.log('   Status:', loan.status);
    console.log('   Is "approved"?', loan.status === 'approved');
    console.log('   Is "fee_pending"?', loan.status === 'fee_pending');
    console.log('   Passes status check?', loan.status === 'approved' || loan.status === 'fee_pending');
    console.log('');
    
    console.log('🔍 ProcessingFeePayment.tsx Condition Checks:');
    console.log('   Application exists?', !!loan);
    console.log('   Has processingFeeAmount?', !!loan.processingFeeAmount);
    console.log('   Processing Fee Amount:', loan.processingFeeAmount);
    console.log('   Processing Fee Paid?', loan.processingFeePaid || false);
    console.log('');
    
    if (loan.status === 'approved' || loan.status === 'fee_pending') {
      if (loan.processingFeeAmount && !loan.processingFeePaid) {
        console.log('✅ ALL CONDITIONS PASS - Payment page should work!');
      } else {
        console.log('⚠️  Status is correct but payment conditions may fail:');
        if (!loan.processingFeeAmount) {
          console.log('   - Missing processingFeeAmount');
        }
        if (loan.processingFeePaid) {
          console.log('   - processingFeePaid is true (already paid)');
        }
      }
    } else {
      console.log('❌ Status check FAILS - Payment page will show error');
      console.log('   Expected: "approved" or "fee_pending"');
      console.log('   Got:', loan.status);
    }
    
    await conn.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
