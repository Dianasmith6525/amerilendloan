import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool(process.env.DATABASE_URL);

async function checkCryptoWallets() {
  console.log('\n=== CRYPTO WALLET CHECK ===\n');

  try {
    // Check if systemSettings table exists
    console.log('1. Checking systemSettings table...');
    const [tables] = await pool.query(`
      SHOW TABLES LIKE 'systemSettings'
    `);

    if (tables.length === 0) {
      console.log('❌ systemSettings table does not exist!');
      console.log('   Run database migrations to create it.');
      return;
    }
    console.log('✓ systemSettings table exists\n');

    // Check table structure first
    console.log('2. Checking systemSettings table structure...');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'systemSettings'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('   Columns:', columns.map(c => c.COLUMN_NAME).join(', '));
    const hasCategory = columns.some(c => c.COLUMN_NAME === 'category');
    console.log(`   Has category column: ${hasCategory ? 'Yes' : 'No'}\n`);

    // Check for crypto wallet settings
    console.log('3. Checking for crypto wallet addresses...');
    const whereClause = hasCategory ? `WHERE category = 'crypto'` : `WHERE \`key\` LIKE 'WALLET_ADDRESS_%'`;
    const [settings] = await pool.query(`
      SELECT \`key\` as settingKey, \`value\` as settingValue, description
      FROM systemSettings
      ${whereClause}
      ORDER BY \`key\`
    `);

    if (settings.length === 0) {
      console.log('❌ No crypto wallet addresses found in database');
      console.log('\n   To add wallet addresses, use the Admin Dashboard:');
      console.log('   1. Log in as admin');
      console.log('   2. Go to Settings tab');
      console.log('   3. Enter wallet addresses for BTC, ETH, USDT, USDC');
      console.log('\n   OR check your .env file for:');
      console.log('   - WALLET_ADDRESS_BTC');
      console.log('   - WALLET_ADDRESS_ETH');
      console.log('   - WALLET_ADDRESS_USDT');
      console.log('   - WALLET_ADDRESS_USDC');
    } else {
      console.log(`✓ Found ${settings.length} crypto wallet setting(s):\n`);
      settings.forEach(setting => {
        const currency = setting.settingKey.replace('WALLET_ADDRESS_', '');
        const hasAddress = setting.settingValue && setting.settingValue.length > 0;
        console.log(`   ${currency}:`);
        console.log(`     Status: ${hasAddress ? '✓ Configured' : '❌ Empty'}`);
        if (hasAddress) {
          console.log(`     Address: ${setting.settingValue.substring(0, 20)}...`);
        }
        console.log(`     Description: ${setting.description || 'N/A'}`);
        console.log('');
      });
    }

    // Check environment variables as fallback
    console.log('4. Checking environment variables (fallback)...');
    const envWallets = {
      BTC: process.env.WALLET_ADDRESS_BTC,
      ETH: process.env.WALLET_ADDRESS_ETH,
      USDT: process.env.WALLET_ADDRESS_USDT,
      USDC: process.env.WALLET_ADDRESS_USDC,
    };

    let hasEnvWallets = false;
    for (const [currency, address] of Object.entries(envWallets)) {
      if (address && address.length > 0) {
        console.log(`   ${currency}: ✓ Configured (${address.substring(0, 20)}...)`);
        hasEnvWallets = true;
      } else {
        console.log(`   ${currency}: ❌ Not set`);
      }
    }

    if (!hasEnvWallets && settings.length === 0) {
      console.log('\n❌ NO WALLET ADDRESSES CONFIGURED!');
      console.log('\n🔧 SOLUTION:');
      console.log('Option 1: Add via Admin Dashboard (Recommended)');
      console.log('  - Log in as admin');
      console.log('  - Go to Settings > Cryptocurrency Wallet Addresses');
      console.log('  - Enter your wallet addresses');
      console.log('\nOption 2: Add to .env file');
      console.log('  WALLET_ADDRESS_BTC=your_btc_address');
      console.log('  WALLET_ADDRESS_ETH=your_eth_address');
      console.log('  WALLET_ADDRESS_USDT=your_usdt_address');
      console.log('  WALLET_ADDRESS_USDC=your_usdc_address');
    }

    console.log('\n=== SUMMARY ===');
    if (settings.length > 0 || hasEnvWallets) {
      console.log('✓ Some wallet addresses are configured');
      console.log('✓ Users can pay processing fees with crypto');
    } else {
      console.log('❌ No wallet addresses configured');
      console.log('⚠️  Users will NOT see crypto payment options');
      console.log('⚠️  Configure wallets in Admin Dashboard > Settings');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkCryptoWallets();
