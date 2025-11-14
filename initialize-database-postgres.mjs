import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('[Database] Connecting to Supabase PostgreSQL...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('[Database] Connected! Creating tables...\n');

    // Create users table
    console.log('Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "openId" VARCHAR(64),
        "name" TEXT,
        "email" VARCHAR(320) UNIQUE,
        "phone" VARCHAR(20),
        "passwordHash" VARCHAR(255),
        "loginMethod" VARCHAR(64),
        "role" VARCHAR(20) NOT NULL DEFAULT 'user',
        "street" VARCHAR(255),
        "city" VARCHAR(100),
        "state" VARCHAR(2),
        "zipCode" VARCHAR(10),
        "middleInitial" VARCHAR(1),
        "dateOfBirth" VARCHAR(10),
        "ssn" VARCHAR(11),
        "idType" VARCHAR(50),
        "idNumber" VARCHAR(100),
        "maritalStatus" VARCHAR(50),
        "dependents" INTEGER,
        "citizenshipStatus" VARCHAR(50),
        "employmentStatus" VARCHAR(50),
        "employer" VARCHAR(255),
        "monthlyIncome" INTEGER,
        "priorBankruptcy" INTEGER,
        "bankruptcyDate" VARCHAR(10),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ users table created\n');

    // Create otpCodes table
    console.log('Creating otpCodes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "otpCodes" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(320) NOT NULL,
        "code" VARCHAR(6) NOT NULL,
        "purpose" VARCHAR(50) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "verified" INTEGER DEFAULT 0 NOT NULL,
        "attempts" INTEGER DEFAULT 0 NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ otpCodes table created\n');

    // Create loanApplications table
    console.log('Creating loanApplications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "loanApplications" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "referenceNumber" VARCHAR(50) NOT NULL,
        "fullName" VARCHAR(200) NOT NULL,
        "email" VARCHAR(320) NOT NULL,
        "phoneNumber" VARCHAR(20) NOT NULL,
        "loanAmount" INTEGER NOT NULL,
        "loanPurpose" VARCHAR(255),
        "status" VARCHAR(50) NOT NULL DEFAULT 'submitted',
        "approvalDate" TIMESTAMP,
        "disbursementDate" TIMESTAMP,
        "interestRate" DECIMAL(5,2),
        "loanTerm" INTEGER,
        "monthlyPayment" INTEGER,
        "totalRepaymentAmount" INTEGER,
        "paymentVerified" INTEGER DEFAULT 0,
        "paymentVerifiedBy" INTEGER,
        "paymentVerifiedAt" TIMESTAMP,
        "paymentVerificationNotes" TEXT,
        "paymentProofUrl" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ loanApplications table created\n');

    // Create payments table
    console.log('Creating payments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" SERIAL PRIMARY KEY,
        "loanApplicationId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "amount" INTEGER NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
        "paymentMethod" VARCHAR(50) NOT NULL DEFAULT 'credit_card',
        "transactionId" VARCHAR(255),
        "processor" VARCHAR(100),
        "processorTransactionId" VARCHAR(255),
        "metadata" TEXT,
        "processedBy" INTEGER,
        "processedAt" TIMESTAMP,
        "principalAmount" INTEGER,
        "interestAmount" INTEGER,
        "feesAmount" INTEGER,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ payments table created\n');

    // Create feeConfiguration table
    console.log('Creating feeConfiguration table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "feeConfiguration" (
        "id" SERIAL PRIMARY KEY,
        "calculationMode" VARCHAR(50) NOT NULL DEFAULT 'percentage',
        "percentageRate" DECIMAL(5,2),
        "fixedFeeAmount" INTEGER,
        "isActive" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ feeConfiguration table created\n');

    // Create disbursements table
    console.log('Creating disbursements table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "disbursements" (
        "id" SERIAL PRIMARY KEY,
        "loanApplicationId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "amount" INTEGER NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
        "accountHolderName" VARCHAR(255) NOT NULL,
        "accountNumber" VARCHAR(50) NOT NULL,
        "routingNumber" VARCHAR(20) NOT NULL,
        "transactionId" VARCHAR(255),
        "failureReason" TEXT,
        "adminNotes" TEXT,
        "initiatedBy" INTEGER,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "completedAt" TIMESTAMP
      )
    `);
    console.log('✅ disbursements table created\n');

    // Create systemSettings table
    console.log('Creating systemSettings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "systemSettings" (
        "id" SERIAL PRIMARY KEY,
        "key" VARCHAR(100) NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "type" VARCHAR(50) NOT NULL DEFAULT 'string',
        "category" VARCHAR(50),
        "description" TEXT,
        "isPublic" INTEGER DEFAULT 0 NOT NULL,
        "updatedBy" INTEGER,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ systemSettings table created\n');

    // Create notifications table
    console.log('Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "loanApplicationId" INTEGER,
        "type" VARCHAR(100) NOT NULL,
        "subject" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
        "sentAt" TIMESTAMP,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ notifications table created\n');

    // Create supportMessages table
    console.log('Creating supportMessages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "supportMessages" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER,
        "senderName" VARCHAR(255) NOT NULL,
        "senderEmail" VARCHAR(320) NOT NULL,
        "senderPhone" VARCHAR(20),
        "subject" VARCHAR(500) NOT NULL,
        "message" TEXT NOT NULL,
        "category" VARCHAR(50) NOT NULL DEFAULT 'general',
        "status" VARCHAR(50) NOT NULL DEFAULT 'new',
        "assignedAgentId" INTEGER,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ supportMessages table created\n');

    console.log('✅ All tables created successfully!');
    console.log('\n[Next Steps]');
    console.log('1. Update Render DATABASE_URL environment variable');
    console.log('2. Redeploy your app on Render');
    console.log('3. Visit https://www.amerilendloan.com');
    console.log('4. Try logging in or creating a new account');

  } catch (error) {
    console.error('❌ Error creating tables:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initializeDatabase();
