import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection({
      uri: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true
      }
    });
    
    console.log('=== Detailed Loan Information ===\n');
    
    const [loans] = await conn.query(`
      SELECT 
        id,
        userId,
        referenceNumber,
        fullName,
        email,
        status,
        requestedAmount,
        approvedAmount,
        processingFeeAmount,
        processingFeePaid,
        idVerificationStatus,
        createdAt,
        updatedAt,
        approvedAt
      FROM loanApplications
      ORDER BY createdAt DESC
    `);
    
    console.log('Loan Applications:');
    console.table(loans.map(loan => ({
      id: loan.id,
      reference: loan.referenceNumber,
      name: loan.fullName,
      email: loan.email,
      status: loan.status,
      requested: `$${(loan.requestedAmount / 100).toFixed(2)}`,
      approved: loan.approvedAmount ? `$${(loan.approvedAmount / 100).toFixed(2)}` : 'N/A',
      fee: loan.processingFeeAmount ? `$${(loan.processingFeeAmount / 100).toFixed(2)}` : 'N/A',
      feePaid: loan.processingFeePaid ? 'Yes' : 'No',
      idStatus: loan.idVerificationStatus,
      created: loan.createdAt,
      approvedAt: loan.approvedAt || 'Not approved'
    })));
    
    console.log('\n=== Raw Data ===');
    console.table(loans);
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
