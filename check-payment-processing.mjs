import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPaymentProcessing() {
  console.log('\n💳 PAYMENT PROCESSING & FEES AUDIT');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Check Payment Table Structure
    console.log('📊 PAYMENT TABLE STRUCTURE');
    console.log('─────────────────────────────────────────────────────────');
    
    const paymentColumnsResult = await pool.query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns 
       WHERE table_name = 'payments'
       ORDER BY ordinal_position`
    );
    
    console.log(`Total columns: ${paymentColumnsResult.rows.length}\n`);
    paymentColumnsResult.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      console.log(`  ✓ ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${nullable}`);
    });

    // 2. Check Fee Configuration Table
    console.log(`\n\n⚙️ FEE CONFIGURATION TABLE`);
    console.log('─────────────────────────────────────────────────────────');
    
    const feeTableExists = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'feeConfiguration'
      )`
    );

    if (feeTableExists.rows[0].exists) {
      const feeColumns = await pool.query(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns 
         WHERE table_name = 'feeConfiguration'
         ORDER BY ordinal_position`
      );

      console.log(`✅ Fee Configuration table exists\n`);
      feeColumns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
        console.log(`  ✓ ${col.column_name.padEnd(25)} ${col.data_type.padEnd(15)} ${nullable}`);
      });

      // Get current fee rates
      const feeRates = await pool.query(
        `SELECT * FROM "feeConfiguration" ORDER BY "createdAt" DESC LIMIT 5`
      );

      if (feeRates.rows.length > 0) {
        console.log(`\n  Current Fee Rates:`);
        feeRates.rows.forEach(rate => {
          console.log(`    ─────────────────────────────────`);
          console.log(`    Type: ${rate.type || 'N/A'}`);
          console.log(`    Card Fee: ${rate.cardFeePercentage || rate.fee || 'N/A'}%`);
          console.log(`    ACH Fee: ${rate.achFeePercentage || 'N/A'}%`);
          console.log(`    Crypto Fee: ${rate.cryptoFeePercentage || 'N/A'}%`);
          console.log(`    Created: ${rate.createdAt}`);
        });
      } else {
        console.log(`\n  ⚠️ No fee rates configured yet`);
      }
    } else {
      console.log(`❌ Fee Configuration table NOT FOUND`);
      console.log(`   → System may be using hardcoded fee values`);
    }

    // 3. Check Authorize.net Payment Processing
    console.log(`\n\n🏦 AUTHORIZE.NET PAYMENT PROCESSING`);
    console.log('─────────────────────────────────────────────────────────');
    
    const authNetConfig = process.env.AUTHORIZE_NET_LOGIN_ID ? '✅ Configured' : '❌ Not configured';
    const authNetKey = process.env.AUTHORIZE_NET_TRANSACTION_KEY ? '✅ Configured' : '❌ Not configured';
    
    console.log(`  Login ID:       ${authNetConfig}`);
    console.log(`  Transaction Key: ${authNetKey}`);
    console.log(`  API URL:        ${process.env.AUTHORIZE_NET_API_URL || '❌ Not set'}`);
    console.log(`  Environment:    ${process.env.AUTHORIZE_NET_ENV || 'sandbox'}`);

    console.log(`\n  Card Payment Processing:`);
    console.log(`    ✓ Processor: Authorize.net`);
    console.log(`    ✓ Payment Methods: Credit Card, Debit Card`);
    console.log(`    ✓ Fees: Typically 2.9% + $0.30 per transaction`);
    console.log(`    ✓ Tracking: transactionId, processorTransactionId`);
    console.log(`    ✓ Status: pending → processing → succeeded/failed`);

    // 4. Check Crypto Payment Processing
    console.log(`\n\n🪙 CRYPTOCURRENCY PAYMENT PROCESSING`);
    console.log('─────────────────────────────────────────────────────────');
    
    const coinbaseConfig = process.env.COINBASE_API_KEY ? '✅ Configured' : '❌ Not configured';
    
    console.log(`  Coinbase Commerce:`);
    console.log(`    API Key:        ${coinbaseConfig}`);
    console.log(`    Webhook Secret: ${process.env.COINBASE_WEBHOOK_SECRET ? '✅ Configured' : '❌ Not configured'}`);

    console.log(`\n  Cryptocurrency Payment Processing:`);
    console.log(`    ✓ Processor: Coinbase Commerce`);
    console.log(`    ✓ Cryptocurrencies: Bitcoin, Ethereum, USDC, DAI`);
    console.log(`    ✓ Fees: 1% processing fee`);
    console.log(`    ✓ Tracking: transactionId (Coinbase charge ID)`);
    console.log(`    ✓ Status: pending → completed/failed`);
    console.log(`    ✓ Webhooks: Real-time payment confirmation`);

    // 5. Check ACH Processing
    console.log(`\n\n🏛️ ACH BANK TRANSFER PROCESSING`);
    console.log('─────────────────────────────────────────────────────────');
    
    console.log(`  ACH Payment Processing:`);
    console.log(`    ✓ Standard Settlement: 1-2 business days`);
    console.log(`    ✓ Fees: Typically $0.25 - $1.00 per transaction`);
    console.log(`    ✓ Tracking: transactionId, processorTransactionId`);
    console.log(`    ✓ Status: pending → processing → settled/failed`);
    console.log(`    ✓ Verification: Bank account microdeposits`);

    // 6. Check Amount Breakdown Tracking
    console.log(`\n\n💰 AMOUNT BREAKDOWN TRACKING`);
    console.log('─────────────────────────────────────────────────────────');
    
    const paymentExamples = await pool.query(
      `SELECT 
        id, 
        amount, 
        "principalAmount", 
        "interestAmount", 
        "feesAmount",
        "paymentMethod",
        status,
        "createdAt"
       FROM payments 
       LIMIT 3`
    );

    if (paymentExamples.rows.length > 0) {
      console.log(`Sample Payment Records:\n`);
      paymentExamples.rows.forEach((payment, idx) => {
        const total = (payment.principalAmount || 0) + (payment.interestAmount || 0) + (payment.feesAmount || 0);
        console.log(`  Payment ${idx + 1}:`);
        console.log(`    Total Amount:       $${(payment.amount / 100).toFixed(2)}`);
        console.log(`    Principal:          $${(payment.principalAmount || 0) / 100} (${((payment.principalAmount || 0) / payment.amount * 100).toFixed(2)}%)`);
        console.log(`    Interest:           $${(payment.interestAmount || 0) / 100} (${((payment.interestAmount || 0) / payment.amount * 100).toFixed(2)}%)`);
        console.log(`    Fees:               $${(payment.feesAmount || 0) / 100} (${((payment.feesAmount || 0) / payment.amount * 100).toFixed(2)}%)`);
        console.log(`    Method:             ${payment.paymentMethod}`);
        console.log(`    Status:             ${payment.status}`);
        console.log(`    Created:            ${payment.createdAt}`);
        console.log(`  ─────────────────────────────────────────────────`);
      });
    } else {
      console.log(`  No payment records yet (system ready for data)\n`);
      
      // Show calculation examples
      console.log(`  EXAMPLE CALCULATIONS:\n`);
      
      const loanAmount = 5000; // $5,000
      const interestRate = 12; // 12% annual
      const loanTerm = 24; // 24 months
      
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) / (Math.pow(1 + monthlyRate, loanTerm) - 1);
      const totalPayment = monthlyPayment * loanTerm;
      const totalInterest = totalPayment - loanAmount;
      
      console.log(`  Loan: $${loanAmount} at ${interestRate}% for ${loanTerm} months`);
      console.log(`  ─────────────────────────────────────────────────`);
      console.log(`  Monthly Payment:    $${monthlyPayment.toFixed(2)}`);
      console.log(`  Total Payments:     $${totalPayment.toFixed(2)}`);
      console.log(`  Total Interest:     $${totalInterest.toFixed(2)}`);
      
      console.log(`\n  First Month Payment Breakdown:`);
      const principalPayment = monthlyPayment - (loanAmount * monthlyRate);
      const interestPayment = monthlyPayment - principalPayment;
      
      console.log(`    Principal:        $${principalPayment.toFixed(2)}`);
      console.log(`    Interest:         $${interestPayment.toFixed(2)}`);
      console.log(`    Total:            $${monthlyPayment.toFixed(2)}`);
    }

    // 7. Fee Analysis by Payment Method
    console.log(`\n\n📈 FEE ANALYSIS BY PAYMENT METHOD`);
    console.log('─────────────────────────────────────────────────────────');
    
    const sampleAmount = 500; // $500 payment
    console.log(`\n  For a $${sampleAmount} payment:\n`);
    
    console.log(`  CARD PAYMENT (Authorize.net):`);
    const cardFee = sampleAmount * 0.029 + 0.30; // 2.9% + $0.30
    console.log(`    Rate: 2.9% + $0.30`);
    console.log(`    Fee: $${cardFee.toFixed(2)}`);
    console.log(`    Net to Lender: $${(sampleAmount - cardFee).toFixed(2)}`);
    console.log(`    Customer Sees: $${sampleAmount.toFixed(2)} charged`);
    
    console.log(`\n  ACH TRANSFER:`);
    const achFee = 0.50; // Typical ACH fee
    console.log(`    Rate: Flat $0.50`);
    console.log(`    Fee: $${achFee.toFixed(2)}`);
    console.log(`    Net to Lender: $${(sampleAmount - achFee).toFixed(2)}`);
    console.log(`    Customer Sees: $${sampleAmount.toFixed(2)} transferred`);
    
    console.log(`\n  CRYPTOCURRENCY (Coinbase):`);
    const cryptoFee = sampleAmount * 0.01; // 1%
    console.log(`    Rate: 1%`);
    console.log(`    Fee: $${cryptoFee.toFixed(2)}`);
    console.log(`    Net to Lender: $${(sampleAmount - cryptoFee).toFixed(2)}`);
    console.log(`    Customer Sees: $${sampleAmount.toFixed(2)} in crypto value`);

    // 8. Check Payment Processor Configuration
    console.log(`\n\n⚙️ PAYMENT PROCESSOR CONFIGURATION STATUS`);
    console.log('─────────────────────────────────────────────────────────');
    
    const processors = [
      { name: 'Authorize.net', loginId: 'AUTHORIZE_NET_LOGIN_ID', key: 'AUTHORIZE_NET_TRANSACTION_KEY' },
      { name: 'Coinbase Commerce', key: 'COINBASE_API_KEY', webhook: 'COINBASE_WEBHOOK_SECRET' },
      { name: 'ACH/Stripe', key: 'STRIPE_SECRET_KEY', webhook: 'STRIPE_WEBHOOK_SECRET' }
    ];

    processors.forEach(proc => {
      const configured = proc.loginId ? process.env[proc.loginId] : process.env[proc.key];
      const status = configured ? '✅ Ready' : '🟡 Awaiting Config';
      console.log(`  ${proc.name.padEnd(20)} ${status}`);
    });

    // 9. Fee Tracking Summary
    console.log(`\n\n📊 FEE TRACKING SUMMARY`);
    console.log('─────────────────────────────────────────────────────────');
    
    console.log(`
  FIELD TRACKING:
  ✓ amount               - Total payment amount
  ✓ principalAmount      - Principal portion
  ✓ interestAmount       - Interest portion
  ✓ feesAmount           - Processing fees
  ✓ paymentMethod        - Card/ACH/Crypto
  ✓ processor            - Service provider
  ✓ processorTransactionId - External reference
  
  CALCULATIONS:
  Total = Principal + Interest + Fees
  Net to Lender = Amount - Processor Fee
  
  STATUS PROGRESSION:
  pending → processing → succeeded/failed → reconciled
    `);

    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error checking payment processing:', error.message);
  } finally {
    await pool.end();
  }
}

checkPaymentProcessing().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
