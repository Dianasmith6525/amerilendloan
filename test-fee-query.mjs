import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testFeeQuery() {
  try {
    const conn = await mysql.createConnection(process.env.DATABASE_URL);

    console.log('\n=== Testing Fee Configuration Query ===\n');

    // Test the exact query that was failing
    const [result] = await conn.query(`
      SELECT id, calculationMode, percentageRate, fixedFeeAmount, isActive, updatedBy, createdAt, updatedAt 
      FROM feeConfiguration 
      WHERE isActive = ? 
      ORDER BY createdAt DESC
    `, [1]);

    console.log('✅ Query successful!');
    console.log('Active fee configuration:', result);

    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testFeeQuery();
