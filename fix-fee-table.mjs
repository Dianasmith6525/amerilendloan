import mysql from 'mysql2/promise';
import 'dotenv/config';

async function fixFeeTable() {
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    console.log('\n=== Fixing Fee Configuration Table ===\n');

    // Drop old table
    console.log('Dropping old feeConfiguration table...');
    await conn.query('DROP TABLE IF EXISTS feeConfiguration');

    // Create new table with correct schema
    console.log('Creating new feeConfiguration table...');
    await conn.query(`
      CREATE TABLE feeConfiguration (
        id INT AUTO_INCREMENT PRIMARY KEY,
        calculationMode ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        percentageRate INT NOT NULL DEFAULT 200 COMMENT 'stored as basis points (200 = 2.00%)',
        fixedFeeAmount INT NOT NULL DEFAULT 200 COMMENT 'in cents (200 = $2.00)',
        isActive INT NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive',
        updatedBy INT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default configuration
    console.log('Inserting default fee configuration...');
    await conn.query(`
      INSERT INTO feeConfiguration (calculationMode, percentageRate, fixedFeeAmount, isActive)
      VALUES ('percentage', 200, 200, 1)
    `);

    // Verify
    const [result] = await conn.query('SELECT * FROM feeConfiguration');
    console.log('\n✅ Fee configuration table created successfully!');
    console.log('Current configuration:', result);

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixFeeTable();
