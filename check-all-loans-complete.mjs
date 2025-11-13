import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found in .env file');
      process.exit(1);
    }
    
    const conn = await mysql.createConnection(process.env.DATABASE_URL);
    
    console.log('=== ALL Loan Applications (Complete Details) ===\n');
    
    const [loans] = await conn.query(`
      SELECT * FROM loanApplications ORDER BY id ASC
    `);
    
    console.log(`Total Loans Found: ${loans.length}\n`);
    
    for (const loan of loans) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Loan ID: ${loan.id}`);
      console.log(`Reference Number: ${loan.referenceNumber}`);
      console.log(`User ID: ${loan.userId}`);
      console.log(`Full Name: ${loan.fullName}`);
      console.log(`Email: ${loan.email}`);
      console.log(`Phone: ${loan.phone}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Status: ${loan.status}`);
      console.log(`Requested Amount: $${(loan.requestedAmount / 100).toFixed(2)}`);
      console.log(`Approved Amount: ${loan.approvedAmount ? '$' + (loan.approvedAmount / 100).toFixed(2) : 'Not approved'}`);
      console.log(`Processing Fee: ${loan.processingFeeAmount ? '$' + (loan.processingFeeAmount / 100).toFixed(2) : 'Not calculated'}`);
      console.log(`Fee Paid: ${loan.processingFeePaid ? 'Yes' : 'No'}`);
      console.log(`ID Verification: ${loan.idVerificationStatus}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Created: ${loan.createdAt}`);
      console.log(`Updated: ${loan.updatedAt}`);
      console.log(`Approved At: ${loan.approvedAt || 'N/A'}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
    
    console.log('=== Summary Table ===');
    console.table(loans.map((loan, index) => ({
      '#': index + 1,
      ID: loan.id,
      Reference: loan.referenceNumber,
      Email: loan.email,
      Status: loan.status,
      Requested: `$${(loan.requestedAmount / 100).toFixed(2)}`,
      Approved: loan.approvedAmount ? `$${(loan.approvedAmount / 100).toFixed(2)}` : 'N/A',
      Created: loan.createdAt
    })));
    
    await conn.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
