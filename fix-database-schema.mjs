import mysql from 'mysql2/promise';
import 'dotenv/config';

async function fixDatabaseSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }
  
  console.log('[Database] Connecting to TiDB Cloud...');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('[Database] Connected successfully!');
    console.log('[Database] Adding missing columns to loanApplications table...\n');
    
    // Add columns to loanApplications table
    try {
      await connection.execute(`
        ALTER TABLE loanApplications 
        ADD COLUMN paymentVerified INT NOT NULL DEFAULT 0 COMMENT '0 = not verified, 1 = verified by admin'
      `);
      console.log('✅ Added paymentVerified column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  paymentVerified column already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE loanApplications 
        ADD COLUMN paymentVerifiedBy INT NULL COMMENT 'Admin user ID who verified payment'
      `);
      console.log('✅ Added paymentVerifiedBy column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  paymentVerifiedBy column already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE loanApplications 
        ADD COLUMN paymentVerifiedAt TIMESTAMP NULL COMMENT 'When payment was verified'
      `);
      console.log('✅ Added paymentVerifiedAt column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  paymentVerifiedAt column already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE loanApplications 
        ADD COLUMN paymentVerificationNotes TEXT NULL COMMENT 'Admin notes on payment verification'
      `);
      console.log('✅ Added paymentVerificationNotes column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  paymentVerificationNotes column already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE loanApplications 
        ADD COLUMN paymentProofUrl MEDIUMTEXT NULL COMMENT 'Screenshot/proof of payment uploaded by user'
      `);
      console.log('✅ Added paymentProofUrl column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  paymentProofUrl column already exists');
      } else {
        throw err;
      }
    }
    
    console.log('\n[Database] Adding currency column to payments table...\n');
    
    try {
      await connection.execute(`
        ALTER TABLE payments 
        ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'USD' COMMENT 'Currency code (USD, BTC, ETH, etc.)'
      `);
      console.log('✅ Added currency column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  currency column already exists');
      } else {
        throw err;
      }
    }
    
    console.log('\n[Database] ✅ Schema update completed successfully!');
    console.log('\n[Database] Verifying changes...\n');
    
    // Verify loanApplications columns
    const [loanCols] = await connection.query(`
      SHOW COLUMNS FROM loanApplications WHERE Field LIKE 'payment%'
    `);
    console.log('loanApplications payment-related columns:');
    console.table(loanCols);
    
    // Verify payments columns
    const [paymentCols] = await connection.query(`
      SHOW COLUMNS FROM payments WHERE Field = 'currency'
    `);
    console.log('\npayments currency column:');
    console.table(paymentCols);
    
  } catch (error) {
    console.error('[Database] Error:', error);
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n[Database] Connection closed');
  }
}

fixDatabaseSchema();
