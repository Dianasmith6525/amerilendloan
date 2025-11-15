import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function checkCryptoWalletAddresses() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   CRYPTOCURRENCY WALLET ADDRESSES - DATABASE VERIFICATION   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Check if systemSettings table exists
    console.log('📋 Step 1: Checking systemSettings table...\n');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'systemSettings'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ systemSettings table does not exist!');
      return;
    }
    console.log('✅ systemSettings table exists\n');

    // 2. Check table structure
    console.log('📋 Step 2: Verifying table structure...\n');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'systemSettings'
      ORDER BY ordinal_position;
    `);

    console.log('Table Columns:');
    columns.rows.forEach((col) => {
      console.log(`  • ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`);
    });
    console.log();

    // 3. Get all wallet settings from database
    console.log('📋 Step 3: Checking wallet addresses in database...\n');
    const walletSettings = await pool.query(`
      SELECT id, key, value, type, category, description, "updatedBy", "createdAt", "updatedAt"
      FROM "systemSettings"
      WHERE key LIKE 'WALLET_ADDRESS_%'
      ORDER BY key;
    `);

    console.log(`Found ${walletSettings.rows.length} wallet address settings:\n`);

    if (walletSettings.rows.length === 0) {
      console.log('⚠️  No wallet addresses configured in database\n');
    } else {
      walletSettings.rows.forEach((setting, index) => {
        const isValid = setting.value && setting.value.trim().length > 0;
        const status = isValid ? '✅' : '❌';
        const currency = setting.key.replace('WALLET_ADDRESS_', '');
        
        console.log(`${status} ${index + 1}. ${setting.key}`);
        console.log(`   Currency: ${currency}`);
        console.log(`   Address: ${setting.value || 'NOT SET'}`);
        
        if (setting.value) {
          console.log(`   Length: ${setting.value.length} characters`);
          console.log(`   First 10 chars: ${setting.value.substring(0, 10)}...`);
        }
        
        console.log(`   Type: ${setting.type || 'string'}`);
        console.log(`   Category: ${setting.category || 'N/A'}`);
        console.log(`   Updated: ${new Date(setting.updatedAt).toLocaleString()}`);
        console.log();
      });
    }

    // 4. Check wallet address format/validity
    console.log('📋 Step 4: Validating wallet address formats...\n');
    
    const validationRules = {
      BTC: /^(bc1|1|3)[a-zA-HJ-NP-Z0-9]{24,62}$/, // SegWit, Legacy, P2SH
      ETH: /^0x[a-fA-F0-9]{40}$/,                  // Ethereum 42 char (0x + 40 hex)
      USDT: /^0x[a-fA-F0-9]{40}$/,                 // ERC-20 (same as ETH)
      USDC: /^0x[a-fA-F0-9]{40}$/,                 // ERC-20 (same as ETH)
    };

    const results = {
      BTC: null,
      ETH: null,
      USDT: null,
      USDC: null,
    };

    walletSettings.rows.forEach((setting) => {
      const currency = setting.key.replace('WALLET_ADDRESS_', '');
      const address = setting.value || '';
      const rule = validationRules[currency];
      
      if (rule && address) {
        results[currency] = rule.test(address);
      }
    });

    Object.entries(results).forEach(([currency, isValid]) => {
      if (isValid === null) {
        console.log(`⚠️  ${currency}: Not configured`);
      } else if (isValid) {
        console.log(`✅ ${currency}: Valid format`);
      } else {
        console.log(`❌ ${currency}: Invalid format`);
      }
    });
    console.log();

    // 5. Check environment variable fallback
    console.log('📋 Step 5: Checking environment variable fallback...\n');
    
    const envWallets = {
      BTC: process.env.WALLET_ADDRESS_BTC || null,
      ETH: process.env.WALLET_ADDRESS_ETH || null,
      USDT: process.env.WALLET_ADDRESS_USDT || null,
      USDC: process.env.WALLET_ADDRESS_USDC || null,
    };

    Object.entries(envWallets).forEach(([currency, address]) => {
      if (address) {
        console.log(`✅ ${currency}: Configured in .env`);
        console.log(`   First 10 chars: ${address.substring(0, 10)}...`);
      } else {
        console.log(`⚠️  ${currency}: Not in .env (will use database value)`);
      }
    });
    console.log();

    // 6. Get crypto payment data
    console.log('📋 Step 6: Checking payments table for crypto transactions...\n');
    
    const cryptoPayments = await pool.query(`
      SELECT 
        id,
        "loanApplicationId",
        "userId",
        amount,
        cryptocurrency,
        cryptoaddress,
        cryptoamount,
        cryptotxhash,
        status,
        "createdAt"
      FROM payments
      WHERE cryptocurrency IS NOT NULL AND cryptocurrency != ''
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `);

    console.log(`Found ${cryptoPayments.rows.length} crypto transactions:\n`);
    
    if (cryptoPayments.rows.length === 0) {
      console.log('No crypto transactions yet\n');
    } else {
      cryptoPayments.rows.forEach((payment) => {
        console.log(`Payment ID: ${payment.id}`);
        console.log(`  Loan ID: ${payment.loanApplicationId}`);
        console.log(`  User ID: ${payment.userId}`);
        console.log(`  Amount: $${(payment.amount / 100).toFixed(2)}`);
        console.log(`  Currency: ${payment.cryptocurrency}`);
        console.log(`  Crypto Amount: ${payment.cryptoamount}`);
        console.log(`  Address: ${payment.cryptoaddress ? payment.cryptoaddress.substring(0, 15) + '...' : 'N/A'}`);
        console.log(`  TX Hash: ${payment.cryptotxhash ? payment.cryptotxhash.substring(0, 15) + '...' : 'Pending'}`);
        console.log(`  Status: ${payment.status}`);
        console.log(`  Date: ${new Date(payment.createdAt).toLocaleString()}`);
        console.log();
      });
    }

    // 7. Summary and recommendations
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                        SUMMARY                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const dbWalletsConfigured = walletSettings.rows.filter(s => s.value).length;
    const allValid = Object.values(results).every(v => v !== false && v !== null);

    console.log(`Database Wallet Settings: ${walletSettings.rows.length} total, ${dbWalletsConfigured} configured`);
    console.log(`Environment Variables: ${Object.values(envWallets).filter(v => v).length} configured`);
    console.log(`Format Validation: ${allValid ? '✅ All valid' : '⚠️ Some invalid'}`);
    console.log(`Crypto Transactions: ${cryptoPayments.rows.length}`);
    console.log();

    // 8. Recommendations
    console.log('📝 RECOMMENDATIONS:\n');
    
    if (dbWalletsConfigured === 0 && Object.values(envWallets).filter(v => v).length === 0) {
      console.log('❌ CRITICAL: No wallet addresses configured anywhere!');
      console.log('   Action: Configure wallet addresses in Admin Dashboard > Settings');
      console.log('   or set WALLET_ADDRESS_* environment variables');
      console.log();
    } else if (dbWalletsConfigured < 4) {
      console.log('⚠️  Some cryptocurrencies not configured in database');
      console.log('   Missing: ' + ['BTC', 'ETH', 'USDT', 'USDC']
        .filter(c => !walletSettings.rows.find(s => s.key === `WALLET_ADDRESS_${c}`))
        .join(', '));
      console.log('   Add them in Admin Dashboard > Settings > Cryptocurrency Wallet Addresses');
      console.log();
    }

    if (!allValid) {
      console.log('❌ Some wallet addresses have invalid format');
      console.log('   Review the addresses and correct any formatting issues');
      console.log('   Expected formats:');
      console.log('   - BTC: bc1q... (SegWit), 1... (Legacy), 3... (P2SH)');
      console.log('   - ETH/USDT/USDC: 0x followed by 40 hex characters');
      console.log();
    }

    if (dbWalletsConfigured === 4 && allValid) {
      console.log('✅ All wallet addresses are properly configured and valid!');
      console.log('   Users can successfully make crypto payments');
      console.log();
    }

    // 9. Configuration details
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              CURRENT CONFIGURATION DETAILS                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log('Database Values:');
    walletSettings.rows.forEach((setting) => {
      const currency = setting.key.replace('WALLET_ADDRESS_', '');
      console.log(`  ${currency}: ${setting.value ? '✅ SET' : '❌ EMPTY'}`);
    });
    console.log();

    console.log('Environment Variables:');
    Object.entries(envWallets).forEach(([currency, value]) => {
      console.log(`  ${currency}: ${value ? '✅ SET' : '❌ NOT SET'}`);
    });
    console.log();

    // 10. Connection info
    console.log('📊 Connection Information:');
    console.log(`  Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ No URL'}`);
    console.log(`  Supported Currencies: BTC, ETH, USDT, USDC`);
    console.log(`  Payment Integration: ${dbWalletsConfigured >= 1 ? '✅ Active' : '❌ Not configured'}`);
    console.log();

  } catch (error) {
    console.error('❌ Error during verification:');
    console.error(error.message);
    console.error(error);
  } finally {
    await pool.end();
    console.log('✓ Database connection closed\n');
  }
}

// Run the check
checkCryptoWalletAddresses();
