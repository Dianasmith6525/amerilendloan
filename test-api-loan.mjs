import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

console.log('🔍 Testing API loan data vs Database...\n');

// Get loan from database
const [loans] = await connection.execute(
  'SELECT * FROM loanApplications WHERE id = ?',
  [1]
);

const dbLoan = loans[0];

console.log('📊 Database Loan Data:');
console.log('   Status:', dbLoan.status);
console.log('   ID:', dbLoan.id);
console.log('   User ID:', dbLoan.userId);
console.log('   Processing Fee Amount:', dbLoan.processingFeeAmount);
console.log('   Processing Fee Paid:', dbLoan.processingFeePaid);
console.log('   Approved Amount:', dbLoan.approvedAmount);
console.log('   Approved At:', dbLoan.approvedAt);
console.log();

// Check what the frontend conditions would be
console.log('🔍 Frontend Condition Checks:');
console.log('   Status === "approved"?', dbLoan.status === "approved");
console.log('   Status === "fee_pending"?', dbLoan.status === "fee_pending");
console.log('   Passes OR check?', dbLoan.status === "approved" || dbLoan.status === "fee_pending");
console.log();

if (dbLoan.status !== "approved" && dbLoan.status !== "fee_pending") {
  console.log('❌ PROBLEM: Status check would FAIL');
  console.log('   Current status:', dbLoan.status);
  console.log('   Expected: "approved" or "fee_pending"');
} else {
  console.log('✅ Status check PASSES');
}

await connection.end();
