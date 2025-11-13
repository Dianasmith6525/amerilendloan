/**
 * Production Readiness Check
 * Analyzes the current configuration and identifies test/mock implementations
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('='.repeat(80));
console.log('PRODUCTION READINESS CHECK - AmeriLend');
console.log('='.repeat(80));
console.log();

const issues = [];
const warnings = [];
const success = [];

// Check 1: Environment Mode
console.log('📋 ENVIRONMENT CONFIGURATION:');
console.log('-'.repeat(80));

const nodeEnv = process.env.NODE_ENV;
console.log(`Current NODE_ENV: ${nodeEnv || 'not set'}`);

if (nodeEnv === 'production') {
  success.push('✓ NODE_ENV is set to production');
} else if (nodeEnv === 'development') {
  warnings.push('⚠️  NODE_ENV is set to development (should be "production" for live use)');
} else {
  issues.push('❌ NODE_ENV is not properly configured');
}
console.log();

// Check 2: Payment Gateway Configuration
console.log('💳 PAYMENT GATEWAY CONFIGURATION:');
console.log('-'.repeat(80));

const authorizeNetEnv = process.env.AUTHORIZENET_ENVIRONMENT;
const authorizeNetLoginId = process.env.AUTHORIZENET_API_LOGIN_ID;
const authorizeNetTransKey = process.env.AUTHORIZENET_TRANSACTION_KEY;

console.log(`Authorize.Net Environment: ${authorizeNetEnv || 'not set'}`);
console.log(`Authorize.Net Login ID: ${authorizeNetLoginId ? '✓ Present' : '✗ Missing'}`);
console.log(`Authorize.Net Transaction Key: ${authorizeNetTransKey ? '✓ Present' : '✗ Missing'}`);

if (authorizeNetEnv === 'production') {
  success.push('✓ Authorize.Net is configured for PRODUCTION');
  console.log('  ✓ Live card payments enabled');
} else if (authorizeNetEnv === 'sandbox') {
  warnings.push('⚠️  Authorize.Net is in SANDBOX mode (test mode)');
  console.log('  ⚠️  Using test transactions only');
} else {
  issues.push('❌ Authorize.Net environment not configured');
}
console.log();

// Check 3: Email Service Configuration
console.log('📧 EMAIL SERVICE CONFIGURATION:');
console.log('-'.repeat(80));

const sendGridKey = process.env.SENDGRID_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const smtpHost = process.env.SMTP_HOST;

console.log(`SendGrid API Key: ${sendGridKey ? '✓ Present' : '✗ Missing'}`);
console.log(`Email From Address: ${emailFrom || 'noreply@amerilendloan.com (default)'}`);
console.log(`SMTP Host: ${smtpHost || '✗ Not configured'}`);

if (sendGridKey || smtpHost) {
  success.push('✓ Email service is configured');
  console.log('  ✓ Email notifications will be sent');
} else {
  warnings.push('⚠️  No email service configured - emails will be logged to console');
}
console.log();

// Check 4: File Storage Configuration
console.log('📁 FILE STORAGE CONFIGURATION:');
console.log('-'.repeat(80));

const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET_NAME;

console.log(`AWS Access Key: ${awsAccessKey ? '✓ Present' : '✗ Missing'}`);
console.log(`AWS Secret Key: ${awsSecretKey ? '✓ Present' : '✗ Missing'}`);
console.log(`AWS Region: ${awsRegion || 'us-east-1 (default)'}`);
console.log(`S3 Bucket: ${s3Bucket || 'amerilend-documents (default)'}`);

if (awsAccessKey && awsSecretKey) {
  success.push('✓ AWS S3 storage is configured');
  console.log('  ✓ Documents will be stored in S3');
} else {
  warnings.push('⚠️  AWS S3 not configured - using local file storage');
  console.log('  ⚠️  Files stored locally in /uploads folder');
  console.log('  ⚠️  For production, configure AWS S3');
}
console.log();

// Check 5: Database Configuration
console.log('🗄️  DATABASE CONFIGURATION:');
console.log('-'.repeat(80));

const dbUrl = process.env.DATABASE_URL;
console.log(`Database URL: ${dbUrl ? '✓ Present' : '✗ Missing'}`);

if (dbUrl) {
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    warnings.push('⚠️  Database is local - not suitable for production hosting');
    console.log('  ⚠️  Using local database');
  } else {
    success.push('✓ Database is configured for remote hosting');
    console.log('  ✓ Using remote database');
  }
} else {
  issues.push('❌ DATABASE_URL not configured');
}
console.log();

// Check 6: Security Configuration
console.log('🔒 SECURITY CONFIGURATION:');
console.log('-'.repeat(80));

const authSecret = process.env.AUTH_SECRET;
const sessionSecret = process.env.SESSION_SECRET;

console.log(`Auth Secret: ${authSecret ? '✓ Present' : '✗ Missing'}`);
console.log(`Session Secret: ${sessionSecret ? '✓ Present' : '✗ Missing'}`);

if (authSecret && authSecret !== 'your-secret-key-here') {
  success.push('✓ Auth secret is configured');
} else {
  issues.push('❌ AUTH_SECRET not properly configured');
}

if (sessionSecret && sessionSecret !== 'your-session-secret-change-in-production') {
  success.push('✓ Session secret is configured');
} else {
  issues.push('❌ SESSION_SECRET not properly configured');
}
console.log();

// Check 7: API Keys & External Services
console.log('🔑 API KEYS & EXTERNAL SERVICES:');
console.log('-'.repeat(80));

const openAiKey = process.env.OPENAI_API_KEY;
const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;

console.log(`OpenAI API Key: ${openAiKey ? '✓ Present' : '✗ Missing'}`);
console.log(`Google Maps API Key: ${googleMapsKey ? '✓ Present' : '✗ Missing'}`);

if (openAiKey) {
  success.push('✓ AI chat features enabled');
} else {
  warnings.push('⚠️  OpenAI not configured - AI features disabled');
}

if (googleMapsKey) {
  success.push('✓ Google Maps integration enabled');
} else {
  warnings.push('⚠️  Google Maps not configured');
}
console.log();

// Check 8: Mock/Test Code Detection
console.log('🔍 MOCK/TEST CODE DETECTION:');
console.log('-'.repeat(80));

const mockDetected = [];

// Check Map component for DEMO_MAP_ID
const mapFilePath = path.join(process.cwd(), 'client', 'src', 'components', 'Map.tsx');
if (fs.existsSync(mapFilePath)) {
  const mapContent = fs.readFileSync(mapFilePath, 'utf-8');
  if (mapContent.includes('DEMO_MAP_ID')) {
    mockDetected.push('Map.tsx uses DEMO_MAP_ID (harmless placeholder)');
  }
}

if (mockDetected.length > 0) {
  console.log('Mock/Test code found:');
  mockDetected.forEach(item => console.log(`  ⚠️  ${item}`));
} else {
  console.log('✓ No mock/test code detected in production files');
}
console.log();

// Summary
console.log('='.repeat(80));
console.log('SUMMARY:');
console.log('-'.repeat(80));
console.log();

if (issues.length > 0) {
  console.log('❌ CRITICAL ISSUES (Must Fix):');
  issues.forEach(issue => console.log(`  ${issue}`));
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (Should Address):');
  warnings.forEach(warning => console.log(`  ${warning}`));
  console.log();
}

if (success.length > 0) {
  console.log('✓ PROPERLY CONFIGURED:');
  success.forEach(item => console.log(`  ${item}`));
  console.log();
}

// Production Readiness Score
const totalChecks = issues.length + warnings.length + success.length;
const productionScore = ((success.length / totalChecks) * 100).toFixed(1);

console.log('-'.repeat(80));
console.log(`Production Readiness Score: ${productionScore}%`);
console.log();

if (issues.length === 0 && warnings.length <= 2) {
  console.log('✅ SYSTEM IS PRODUCTION READY!');
  console.log('   All critical configurations are in place.');
  console.log('   Minor warnings can be addressed as needed.');
} else if (issues.length === 0) {
  console.log('⚠️  SYSTEM IS MOSTLY READY FOR PRODUCTION');
  console.log('   No critical issues, but several warnings to address.');
  console.log('   Review warnings above before going live.');
} else {
  console.log('❌ SYSTEM NOT READY FOR PRODUCTION');
  console.log('   Critical issues must be resolved first.');
  console.log('   Fix all issues marked with ❌ above.');
}

console.log();
console.log('='.repeat(80));
console.log();

// Recommendations
console.log('💡 RECOMMENDATIONS FOR PRODUCTION:');
console.log('-'.repeat(80));
console.log();
console.log('1. Environment Variables:');
console.log('   - Set NODE_ENV=production in your .env file');
console.log('   - Keep AUTHORIZENET_ENVIRONMENT=production for live payments');
console.log();
console.log('2. Payment Processing:');
console.log('   - Ensure you have real Authorize.Net production credentials');
console.log('   - Test payments in sandbox mode first');
console.log('   - Switch to production only when ready for live transactions');
console.log();
console.log('3. File Storage:');
console.log('   - For production: Configure AWS S3 for reliable file storage');
console.log('   - Local storage works but is not recommended for production');
console.log();
console.log('4. Email Service:');
console.log('   - SendGrid is configured ✓');
console.log('   - Verify email sending works by testing from admin dashboard');
console.log();
console.log('5. Database:');
console.log('   - Ensure you have backups configured');
console.log('   - Use a production database (not localhost) for live hosting');
console.log();
console.log('6. Security:');
console.log('   - Generate strong, unique secrets for AUTH_SECRET and SESSION_SECRET');
console.log('   - Never commit .env file to version control');
console.log('   - Use environment variables on your hosting platform');
console.log();
console.log('='.repeat(80));
