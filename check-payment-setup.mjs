import 'dotenv/config';
import mysql from 'mysql2/promise';

async function checkPaymentSetup() {
  try {
    console.log('[Payment Test] Connecting to database...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Check existing loans and their payment eligibility
    console.log('\n[Test 1] Checking loan applications...');
    const [loans] = await connection.execute(`
      SELECT 
        id, 
        referenceNumber,
        status,
        approvedAmount,
        processingFeeAmount,
        processingFeePaid,
        userId,
        email
      FROM loanApplications
      ORDER BY id DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Recent Loans:');
    loans.forEach(loan => {
      console.log(`\nLoan ID: ${loan.id} (${loan.referenceNumber})`);
      console.log(`  Status: ${loan.status}`);
      console.log(`  Approved Amount: $${loan.approvedAmount || 0}`);
      console.log(`  Processing Fee: $${(loan.processingFeeAmount || 0) / 100}`);
      console.log(`  Fee Paid: ${loan.processingFeePaid ? 'Yes' : 'No'}`);
      console.log(`  User Email: ${loan.email}`);
      console.log(`  Payment Eligible: ${loan.status === 'approved' && !loan.processingFeePaid ? '✅ YES' : '❌ NO'}`);
    });
    
    // Check existing payments
    console.log('\n[Test 2] Checking payment records...');
    const [payments] = await connection.execute(`
      SELECT 
        id,
        loanApplicationId,
        amount,
        status,
        paymentMethod,
        paymentProvider,
        transactionId,
        createdAt
      FROM payments
      ORDER BY id DESC
      LIMIT 5
    `);
    
    console.log(`\n💳 Payment Records: ${payments.length} found`);
    payments.forEach(payment => {
      console.log(`\nPayment ID: ${payment.id}`);
      console.log(`  Loan: ${payment.loanApplicationId}`);
      console.log(`  Amount: $${(payment.amount / 100).toFixed(2)}`);
      console.log(`  Status: ${payment.status}`);
      console.log(`  Method: ${payment.paymentMethod} via ${payment.paymentProvider}`);
      console.log(`  Transaction: ${payment.transactionId || 'N/A'}`);
    });
    
    // Check if we need to create a test scenario
    const approvedLoans = loans.filter(l => l.status === 'approved' && !l.processingFeePaid);
    
    if (approvedLoans.length === 0) {
      console.log('\n⚠️  No approved loans ready for payment testing.');
      console.log('\nTo test payment functionality:');
      console.log('1. You need a loan with status = "approved"');
      console.log('2. The loan should have processingFeeAmount set');
      console.log('3. The loan should have processingFeePaid = 0');
      
      // Offer to set up a test scenario
      const pendingLoans = loans.filter(l => l.status === 'pending');
      if (pendingLoans.length > 0) {
        console.log(`\n💡 Found ${pendingLoans.length} pending loan(s).`);
        console.log('Would you like me to create a script to approve one for testing?');
      }
    } else {
      console.log('\n✅ Ready for payment testing!');
      console.log(`\nTest with Loan ID: ${approvedLoans[0].id}`);
      console.log(`Payment URL: http://localhost:5173/payment/${approvedLoans[0].id}`);
    }
    
    // Check Authorize.Net configuration
    console.log('\n[Test 3] Checking payment gateway configuration...');
    console.log(`  AUTHORIZE_NET_API_LOGIN_ID: ${process.env.AUTHORIZE_NET_API_LOGIN_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`  AUTHORIZE_NET_TRANSACTION_KEY: ${process.env.AUTHORIZE_NET_TRANSACTION_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  AUTHORIZE_NET_PUBLIC_CLIENT_KEY: ${process.env.AUTHORIZE_NET_PUBLIC_CLIENT_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    
    await connection.end();
    console.log('\n✅ Payment setup check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPaymentSetup();
