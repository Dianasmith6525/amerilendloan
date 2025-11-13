import mysql from 'mysql2/promise';
import 'dotenv/config';

async function syncPaymentsTable() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }
  
  console.log('[Database] Connecting to TiDB Cloud...');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('[Database] Connected successfully!');
    console.log('[Database] Adding missing columns to payments table...\n');
    
    const columnsToAdd = [
      { name: 'paymentProvider', sql: "paymentProvider ENUM('stripe','authorizenet','crypto','other') NULL COMMENT 'Payment gateway provider'" },
      { name: 'paymentIntentId', sql: "paymentIntentId VARCHAR(255) NULL COMMENT 'Stripe/AuthorizeNet transaction ID'" },
      { name: 'cardLast4', sql: "cardLast4 VARCHAR(4) NULL COMMENT 'Last 4 digits of card'" },
      { name: 'cardBrand', sql: "cardBrand VARCHAR(50) NULL COMMENT 'Card brand (Visa, Mastercard, etc.)'" },
      { name: 'paymentDate', sql: "paymentDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When payment was made'" },
      { name: 'reference', sql: "reference VARCHAR(255) NULL COMMENT 'External payment reference'" },
      { name: 'description', sql: "description TEXT NULL COMMENT 'Payment description or notes'" },
      { name: 'principalAmount', sql: "principalAmount INT NULL COMMENT 'Principal amount in cents'" },
      { name: 'interestAmount', sql: "interestAmount INT NULL COMMENT 'Interest amount in cents'" },
      { name: 'feesAmount', sql: "feesAmount INT NULL COMMENT 'Fees amount in cents'" },
      { name: 'processor', sql: "processor VARCHAR(100) NULL COMMENT 'Payment processor name'" },
      { name: 'processorTransactionId', sql: "processorTransactionId VARCHAR(255) NULL COMMENT 'Processor-specific transaction ID'" },
      { name: 'processedBy', sql: "processedBy INT NULL COMMENT 'Admin user ID who processed payment'" },
      { name: 'processedAt', sql: "processedAt TIMESTAMP NULL COMMENT 'When payment was processed'" },
      { name: 'updatedAt', sql: "updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time'" },
    ];
    
    for (const column of columnsToAdd) {
      try {
        await connection.execute(`ALTER TABLE payments ADD COLUMN ${column.sql}`);
        console.log(`✅ Added ${column.name} column`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`⏭️  ${column.name} column already exists`);
        } else {
          console.error(`❌ Error adding ${column.name}:`, err.message);
        }
      }
    }
    
    // Update status enum to include 'succeeded' and 'cancelled'
    try {
      console.log('\n[Database] Updating status enum values...');
      await connection.execute(`
        ALTER TABLE payments 
        MODIFY COLUMN status ENUM(
          'pending',
          'processing',
          'completed',
          'succeeded',
          'failed',
          'refunded',
          'cancelled'
        ) NOT NULL DEFAULT 'pending'
      `);
      console.log('✅ Updated status enum');
    } catch (err) {
      console.log('⏭️  Status enum already has all values or error:', err.message);
    }
    
    // Update paymentMethod enum
    try {
      console.log('\n[Database] Updating paymentMethod enum values...');
      await connection.execute(`
        ALTER TABLE payments 
        MODIFY COLUMN paymentMethod ENUM(
          'card',
          'credit_card',
          'debit_card',
          'bank_transfer',
          'ach',
          'crypto',
          'cash',
          'check',
          'other'
        ) NOT NULL
      `);
      console.log('✅ Updated paymentMethod enum');
    } catch (err) {
      console.log('⏭️  PaymentMethod enum already has all values or error:', err.message);
    }
    
    // Update cryptoCurrency enum
    try {
      console.log('\n[Database] Updating cryptoCurrency column type...');
      await connection.execute(`
        ALTER TABLE payments 
        MODIFY COLUMN cryptoCurrency ENUM('BTC','ETH','USDT','USDC') NULL
      `);
      console.log('✅ Updated cryptoCurrency to ENUM');
    } catch (err) {
      console.log('⏭️  CryptoCurrency already ENUM or error:', err.message);
    }
    
    console.log('\n[Database] ✅ Payments table sync completed!');
    console.log('\n[Database] Current table structure:\n');
    
    const [columns] = await connection.query(`SHOW COLUMNS FROM payments`);
    console.table(columns);
    
  } catch (error) {
    console.error('[Database] Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n[Database] Connection closed');
  }
}

syncPaymentsTable();
