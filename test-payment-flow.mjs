import { config } from 'dotenv';
import { connect } from '@tidbcloud/serverless';

config();

const conn = connect({ url: process.env.DATABASE_URL });

async function testPaymentFlow() {
  console.log('🔍 Testing Payment Processing Flow\n');
  console.log('='.repeat(60));

  try {
    // 1. Check for approved loans that need payment
    console.log('\n1️⃣ Checking for approved loans requiring payment...');
    const approvedLoans = await conn.execute(`
      SELECT 
        id,
        referenceNumber,
        fullName,
        email,
        status,
        approvedAmount,
        processingFeeAmount,
        processingFeePaid,
        paymentVerified,
        createdAt
      FROM loanApplications 
      WHERE status = 'approved' 
      AND processingFeePaid = 0
      ORDER BY createdAt DESC
      LIMIT 5
    `);

    if (approvedLoans.rows.length === 0) {
      console.log('   ❌ No approved loans waiting for payment');
    } else {
      console.log(`   ✅ Found ${approvedLoans.rows.length} approved loan(s) awaiting payment:\n`);
      approvedLoans.rows.forEach(loan => {
        const feeAmount = loan.processingFeeAmount ? (loan.processingFeeAmount / 100).toFixed(2) : '0.00';
        console.log(`   📋 Loan #${loan.referenceNumber}`);
        console.log(`      Customer: ${loan.fullName}`);
        console.log(`      Email: ${loan.email}`);
        console.log(`      Approved Amount: $${(loan.approvedAmount / 100).toFixed(2)}`);
        console.log(`      Processing Fee: $${feeAmount}`);
        console.log(`      Status: ${loan.status}`);
        console.log('');
      });
    }

    // 2. Check for paid but unverified payments
    console.log('\n2️⃣ Checking for paid fees awaiting admin verification...');
    const paidUnverified = await conn.execute(`
      SELECT 
        id,
        referenceNumber,
        fullName,
        email,
        status,
        processingFeeAmount,
        processingFeePaid,
        paymentVerified,
        paymentVerifiedBy,
        paymentVerifiedAt,
        createdAt
      FROM loanApplications 
      WHERE processingFeePaid = 1 
      AND (paymentVerified IS NULL OR paymentVerified = 0)
      ORDER BY createdAt DESC
      LIMIT 5
    `);

    if (paidUnverified.rows.length === 0) {
      console.log('   ❌ No payments awaiting verification');
    } else {
      console.log(`   ✅ Found ${paidUnverified.rows.length} payment(s) awaiting verification:\n`);
      paidUnverified.rows.forEach(loan => {
        const feeAmount = loan.processingFeeAmount ? (loan.processingFeeAmount / 100).toFixed(2) : '0.00';
        console.log(`   📋 Loan #${loan.referenceNumber}`);
        console.log(`      Customer: ${loan.fullName}`);
        console.log(`      Processing Fee: $${feeAmount}`);
        console.log(`      Status: ${loan.status}`);
        console.log(`      Payment Status: PAID - Awaiting Verification`);
        console.log('');
      });
    }

    // 3. Check payment records
    console.log('\n3️⃣ Checking payment records...');
    const payments = await conn.execute(`
      SELECT 
        p.id,
        p.loanApplicationId,
        p.amount,
        p.paymentMethod,
        p.paymentProvider,
        p.status,
        p.createdAt,
        p.completedAt,
        p.cardLast4,
        p.cardBrand,
        p.cryptoCurrency,
        la.referenceNumber,
        la.fullName
      FROM payments p
      LEFT JOIN loanApplications la ON p.loanApplicationId = la.id
      ORDER BY p.createdAt DESC
      LIMIT 10
    `);

    if (payments.rows.length === 0) {
      console.log('   ❌ No payment records found');
    } else {
      console.log(`   ✅ Found ${payments.rows.length} payment record(s):\n`);
      payments.rows.forEach(payment => {
        const amount = (payment.amount / 100).toFixed(2);
        const status = payment.status === 'succeeded' ? '✅' : 
                      payment.status === 'pending' ? '⏳' : '❌';
        
        let methodInfo = '';
        if (payment.paymentMethod === 'card' && payment.cardLast4) {
          methodInfo = `${payment.cardBrand} ****${payment.cardLast4}`;
        } else if (payment.paymentMethod === 'crypto' && payment.cryptoCurrency) {
          methodInfo = payment.cryptoCurrency;
        } else {
          methodInfo = payment.paymentMethod;
        }

        console.log(`   ${status} Payment #${payment.id}`);
        console.log(`      Loan: ${payment.referenceNumber} (${payment.fullName})`);
        console.log(`      Amount: $${amount}`);
        console.log(`      Method: ${methodInfo}`);
        console.log(`      Provider: ${payment.paymentProvider}`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Created: ${new Date(payment.createdAt).toLocaleString()}`);
        if (payment.completedAt) {
          console.log(`      Completed: ${new Date(payment.completedAt).toLocaleString()}`);
        }
        console.log('');
      });
    }

    // 4. Check verified payments
    console.log('\n4️⃣ Checking verified payments...');
    const verified = await conn.execute(`
      SELECT 
        la.id,
        la.referenceNumber,
        la.fullName,
        la.processingFeeAmount,
        la.paymentVerified,
        la.paymentVerifiedAt,
        la.paymentVerificationNotes,
        u.fullName as verifiedByName,
        la.status
      FROM loanApplications la
      LEFT JOIN users u ON la.paymentVerifiedBy = u.id
      WHERE la.paymentVerified = 1
      ORDER BY la.paymentVerifiedAt DESC
      LIMIT 5
    `);

    if (verified.rows.length === 0) {
      console.log('   ❌ No verified payments found');
    } else {
      console.log(`   ✅ Found ${verified.rows.length} verified payment(s):\n`);
      verified.rows.forEach(loan => {
        const feeAmount = (loan.processingFeeAmount / 100).toFixed(2);
        console.log(`   ✅ Loan #${loan.referenceNumber}`);
        console.log(`      Customer: ${loan.fullName}`);
        console.log(`      Fee Amount: $${feeAmount}`);
        console.log(`      Verified By: ${loan.verifiedByName || 'Unknown'}`);
        console.log(`      Verified At: ${new Date(loan.paymentVerifiedAt).toLocaleString()}`);
        if (loan.paymentVerificationNotes) {
          console.log(`      Notes: ${loan.paymentVerificationNotes}`);
        }
        console.log(`      Current Status: ${loan.status}`);
        console.log('');
      });
    }

    // 5. Test payment configuration
    console.log('\n5️⃣ Checking payment configuration...');
    const config = await conn.execute(`
      SELECT * FROM feeConfiguration LIMIT 1
    `);

    if (config.rows.length === 0) {
      console.log('   ⚠️  No fee configuration found - payments may not calculate correctly');
    } else {
      const cfg = config.rows[0];
      console.log('   ✅ Fee configuration found:');
      console.log(`      Mode: ${cfg.calculationMode}`);
      if (cfg.calculationMode === 'percentage') {
        console.log(`      Percentage: ${cfg.percentageFee}%`);
      } else {
        console.log(`      Fixed Amount: $${(cfg.fixedFeeAmount / 100).toFixed(2)}`);
      }
      console.log('');
    }

    // 6. Check crypto payment support
    console.log('\n6️⃣ Checking crypto payment configuration...');
    const cryptoWallets = await conn.execute(`
      SELECT * FROM cryptoWallets WHERE isActive = 1
    `);

    if (cryptoWallets.rows.length === 0) {
      console.log('   ⚠️  No active crypto wallets configured');
    } else {
      console.log(`   ✅ Found ${cryptoWallets.rows.length} active crypto wallet(s):`);
      cryptoWallets.rows.forEach(wallet => {
        console.log(`      ${wallet.currency}: ${wallet.address.substring(0, 20)}...`);
      });
      console.log('');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PAYMENT SYSTEM SUMMARY\n');
    
    const totalApproved = approvedLoans.rows.length;
    const totalAwaitingVerification = paidUnverified.rows.length;
    const totalPayments = payments.rows.length;
    const successfulPayments = payments.rows.filter(p => p.status === 'succeeded').length;
    const pendingPayments = payments.rows.filter(p => p.status === 'pending').length;
    const verifiedPayments = verified.rows.length;

    console.log(`✅ Loans awaiting payment: ${totalApproved}`);
    console.log(`⏳ Payments awaiting verification: ${totalAwaitingVerification}`);
    console.log(`💳 Total payment records: ${totalPayments}`);
    console.log(`   - Successful: ${successfulPayments}`);
    console.log(`   - Pending: ${pendingPayments}`);
    console.log(`✅ Verified payments: ${verifiedPayments}`);
    
    console.log('\n🔍 PAYMENT FLOW STATUS:');
    if (config.rows.length === 0) {
      console.log('   ❌ ISSUE: No fee configuration - setup required');
    } else {
      console.log('   ✅ Fee configuration is set up');
    }
    
    if (totalApproved > 0 && totalPayments === 0) {
      console.log('   ⚠️  WARNING: Approved loans exist but no payments recorded');
      console.log('      → Users may not be able to access payment page');
    }
    
    if (totalAwaitingVerification > 0) {
      console.log(`   ⚠️  ACTION REQUIRED: ${totalAwaitingVerification} payment(s) need admin verification`);
      console.log('      → Admin should verify these in the dashboard');
    }
    
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error testing payment flow:', error.message);
    console.error(error);
  }
}

testPaymentFlow();
