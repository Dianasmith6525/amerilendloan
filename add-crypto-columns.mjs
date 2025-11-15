import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addCryptoColumns() {
  try {
    console.log('\n=== ADDING MISSING CRYPTO PAYMENT COLUMNS ===\n');

    // List of columns to add with their definitions
    const columnsToAdd = [
      {
        name: 'cryptoCurrency',
        definition: 'VARCHAR(50)',
        description: 'Cryptocurrency type (BTC, ETH, USDT, USDC)'
      },
      {
        name: 'cryptoAddress',
        definition: 'VARCHAR(255)',
        description: 'Crypto wallet address'
      },
      {
        name: 'cryptoAmount',
        definition: 'VARCHAR(50)',
        description: 'Amount in crypto (e.g., "0.0012 BTC")'
      },
      {
        name: 'cryptoTxHash',
        definition: 'VARCHAR(255)',
        description: 'Blockchain transaction hash'
      },
      {
        name: 'paymentProvider',
        definition: 'VARCHAR(50)',
        description: 'Payment provider (Authorize.net, Coinbase, etc.)'
      },
      {
        name: 'cardLast4',
        definition: 'VARCHAR(4)',
        description: 'Last 4 digits of card'
      },
      {
        name: 'cardBrand',
        definition: 'VARCHAR(50)',
        description: 'Card brand (Visa, Mastercard, etc.)'
      },
      {
        name: 'paymentIntentId',
        definition: 'VARCHAR(255)',
        description: 'Payment gateway transaction ID'
      },
      {
        name: 'paymentDate',
        definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL',
        description: 'When payment was made'
      },
      {
        name: 'completedAt',
        definition: 'TIMESTAMP',
        description: 'When payment was completed'
      },
      {
        name: 'currency',
        definition: 'VARCHAR(10) DEFAULT \'USD\'',
        description: 'Currency type'
      },
      {
        name: 'reference',
        definition: 'VARCHAR(255)',
        description: 'External payment reference'
      },
      {
        name: 'description',
        definition: 'TEXT',
        description: 'Payment description'
      }
    ];

    console.log('📋 Checking which columns exist...\n');
    
    for (const col of columnsToAdd) {
      try {
        const result = await pool.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'payments' 
            AND column_name = $1
          ) as exists
        `, [col.name]);

        if (result.rows[0].exists) {
          console.log(`✅ ${col.name} - Already exists`);
        } else {
          console.log(`⚠️  ${col.name} - Missing, will add`);
          
          // Add the column
          const query = `ALTER TABLE payments ADD COLUMN ${col.name} ${col.definition}`;
          await pool.query(query);
          console.log(`   ✓ Added ${col.name}`);
        }
      } catch (error) {
        console.error(`   ❌ Error processing ${col.name}: ${error.message}`);
      }
    }

    console.log('\n✅ Migration complete!\n');

    // Show updated structure
    console.log('📋 Updated payments table columns:');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'payments'
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
      console.log(`  • ${row.column_name} (${row.data_type}) - ${nullable}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addCryptoColumns();
