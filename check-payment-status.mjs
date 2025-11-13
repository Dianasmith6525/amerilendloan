import mysql from 'mysql2/promise';
import 'dotenv/config';

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('=== PAYMENT FLOW STATUS ===\n');
  
  console.log('1. Approved loans awaiting payment:');
  const [approved] = await conn.query(
    SELECT id, referenceNumber, fullName, approvedAmount, processingFeeAmount, processingFeePaid 
    FROM loanApplications 
    WHERE status = 'approved' AND processingFeePaid = 0
    LIMIT 5
  );
  console.table(approved);
  
  console.log('\n2. Payments awaiting verification:');
  const [awaitingVerify] = await conn.query(
    SELECT id, referenceNumber, fullName, processingFeeAmount, processingFeePaid, paymentVerified
    FROM loanApplications 
    WHERE processingFeePaid = 1 AND (paymentVerified IS NULL OR paymentVerified = 0)
    LIMIT 5
  );
  console.table(awaitingVerify);
  
  console.log('\n3. Recent payment records:');
  const [payments] = await conn.query(
    SELECT id, loanApplicationId, amount, paymentMethod, status, createdAt 
    FROM payments 
    ORDER BY createdAt DESC 
    LIMIT 5
  );
  console.table(payments);
  
  await conn.end();
})();
