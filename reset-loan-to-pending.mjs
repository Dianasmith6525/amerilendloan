import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('=== Resetting Loan to Pending Status ===\n');
    
    // Reset loan 1 back to pending status
    await conn.query(`
      UPDATE loanApplications 
      SET 
        status = 'pending',
        approvedAmount = NULL,
        processingFeeAmount = NULL,
        processingFeePaid = 0,
        approvedAt = NULL
      WHERE id = 1
    `);
    
    console.log('✅ Loan reset successfully!\n');
    
    // Show updated loan
    const [loans] = await conn.query(`
      SELECT 
        id,
        referenceNumber,
        fullName,
        email,
        status,
        requestedAmount,
        approvedAmount,
        processingFeeAmount,
        idVerificationStatus,
        createdAt,
        approvedAt
      FROM loanApplications
      WHERE id = 1
    `);
    
    console.log('Updated Loan Status:');
    console.table(loans.map(loan => ({
      id: loan.id,
      reference: loan.referenceNumber,
      name: loan.fullName,
      status: loan.status,
      requested: `$${(loan.requestedAmount / 100).toFixed(2)}`,
      approved: loan.approvedAmount ? `$${(loan.approvedAmount / 100).toFixed(2)}` : 'Not yet',
      fee: loan.processingFeeAmount ? `$${(loan.processingFeeAmount / 100).toFixed(2)}` : 'Not calculated',
      idStatus: loan.idVerificationStatus,
      approvedAt: loan.approvedAt || 'Not approved yet'
    })));
    
    console.log('\n📋 Next Steps:');
    console.log('1. User should upload ID documents from their dashboard');
    console.log('2. Admin reviews and approves ID verification');
    console.log('3. Admin reviews loan and sets approval amount');
    console.log('4. User pays processing fee');
    console.log('5. Admin disburses loan');
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
