/**
 * Generate secure secrets for production use
 * Creates cryptographically secure random strings for AUTH_SECRET and SESSION_SECRET
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

console.log('='.repeat(80));
console.log('SECURE SECRET GENERATOR');
console.log('='.repeat(80));
console.log();

// Generate cryptographically secure random strings
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

const authSecret = generateSecret(32); // 64 characters hex
const sessionSecret = generateSecret(32); // 64 characters hex

console.log('✓ Generated secure secrets:');
console.log();
console.log('AUTH_SECRET:');
console.log(authSecret);
console.log();
console.log('SESSION_SECRET:');
console.log(sessionSecret);
console.log();
console.log('-'.repeat(80));
console.log();

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExists = fs.existsSync(envPath);

console.log('📝 INSTRUCTIONS TO UPDATE .ENV:');
console.log('-'.repeat(80));
console.log();

if (envExists) {
  console.log('1. Open your .env file');
  console.log('2. Add or update these lines:');
  console.log();
  console.log(`AUTH_SECRET=${authSecret}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);
  console.log();
  console.log('3. Save the file and restart your server');
  console.log();
  console.log('⚠️  IMPORTANT: Keep these secrets secure and never commit them to version control!');
} else {
  console.log('⚠️  .env file not found in current directory');
  console.log('Please create a .env file with the secrets above');
}

console.log();
console.log('='.repeat(80));

// Also generate additional production recommendations
console.log();
console.log('📋 COMPLETE PRODUCTION .ENV TEMPLATE:');
console.log('-'.repeat(80));
console.log();

const template = `# Environment
NODE_ENV=production

# Database
DATABASE_URL=your-database-url-here

# Security (GENERATED - Keep Secret!)
AUTH_SECRET=${authSecret}
SESSION_SECRET=${sessionSecret}

# Email Service (SendGrid)
EMAIL_SERVICE_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key-here
EMAIL_FROM=noreply@amerilendloan.com
EMAIL_FROM_NAME=AmeriLend

# Payment Gateway (Authorize.Net)
AUTHORIZENET_API_LOGIN_ID=your-api-login-id
AUTHORIZENET_TRANSACTION_KEY=your-transaction-key
AUTHORIZENET_ENVIRONMENT=production

# File Storage (AWS S3) - Optional but recommended
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=amerilend-documents

# AI Features (OpenAI)
OPENAI_API_KEY=your-openai-key-here

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key-here

# Cryptocurrency Wallets (Your Personal Wallets)
WALLET_ADDRESS_BTC=your-bitcoin-wallet-address
WALLET_ADDRESS_ETH=your-ethereum-wallet-address
WALLET_ADDRESS_USDT=your-usdt-erc20-wallet-address
WALLET_ADDRESS_USDC=your-usdc-erc20-wallet-address
`;

console.log(template);
console.log();
console.log('='.repeat(80));
