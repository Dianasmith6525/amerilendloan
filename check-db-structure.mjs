import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkStructure() {
  try {
    console.log('\n=== CHECKING DATABASE STRUCTURE ===\n');

    // Get all tables
    console.log('📋 All tables in database:');
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    tablesRes.rows.forEach(row => {
      console.log(`  • ${row.table_name}`);
    });

    // Check payments table structure
    console.log('\n📋 Payments table columns:');
    const paymentsRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'payments'
      ORDER BY ordinal_position
    `);
    
    if (paymentsRes.rows.length === 0) {
      console.log('  ❌ Payments table does not exist or has no columns');
    } else {
      paymentsRes.rows.forEach(row => {
        const nullable = row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
        console.log(`  • ${row.column_name} (${row.data_type}) - ${nullable}`);
      });
    }

    // Check systemSettings table structure
    console.log('\n📋 SystemSettings table columns:');
    const settingsRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'systemSettings'
      ORDER BY ordinal_position
    `);
    
    if (settingsRes.rows.length === 0) {
      console.log('  ❌ SystemSettings table does not exist or has no columns');
    } else {
      settingsRes.rows.forEach(row => {
        const nullable = row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
        console.log(`  • ${row.column_name} (${row.data_type}) - ${nullable}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStructure();
