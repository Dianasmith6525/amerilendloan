import mysql from 'mysql2/promise';

async function createPaymentsTable() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Creating payments table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transactionId VARCHAR(100) NOT NULL UNIQUE,
        loanId INT NOT NULL,
        userId INT NOT NULL,
        amount INT NOT NULL,
        paymentMethod ENUM(
          'credit_card',
          'debit_card',
          'bank_transfer',
          'ach',
          'crypto',
          'cash',
          'check',
          'other'
        ) NOT NULL,
        status ENUM(
          'pending',
          'processing',
          'completed',
          'failed',
          'refunded',
          'cancelled'
        ) NOT NULL DEFAULT 'pending',
        paymentDate TIMESTAMP NOT NULL,
        reference VARCHAR(255),
        description TEXT,
        principalAmount INT,
        interestAmount INT,
        feesAmount INT,
        processor VARCHAR(100),
        processorTransactionId VARCHAR(255),
        metadata TEXT,
        processedBy INT,
        processedAt TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_loanId (loanId),
        INDEX idx_userId (userId),
        INDEX idx_status (status),
        INDEX idx_paymentDate (paymentDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Payments table created successfully');
    
  } catch (error) {
    console.error('Error creating payments table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createPaymentsTable()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
