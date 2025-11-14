import mysql from 'mysql2/promise';
import 'dotenv/config';

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  console.log('[Database] Connecting to TiDB...');
  // Parse the connection URL and remove the ssl parameter from the URL
  let connectionUrl = process.env.DATABASE_URL;
  connectionUrl = connectionUrl.replace(/\?ssl=\{[^}]+\}/, '');
  
  const connection = await mysql.createConnection({
    uri: connectionUrl,
    ssl: {
      rejectUnauthorized: true
    }
  });

  try {
    console.log('[Database] Connected! Creating tables...\n');

    // Create users table
    console.log('Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`openId\` varchar(64),
        \`name\` text,
        \`email\` varchar(320) UNIQUE,
        \`phone\` varchar(20),
        \`passwordHash\` varchar(255),
        \`loginMethod\` varchar(64),
        \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
        \`street\` varchar(255),
        \`city\` varchar(100),
        \`state\` varchar(2),
        \`zipCode\` varchar(10),
        \`middleInitial\` varchar(1),
        \`dateOfBirth\` varchar(10),
        \`ssn\` varchar(11),
        \`idType\` varchar(50),
        \`idNumber\` varchar(100),
        \`maritalStatus\` varchar(50),
        \`dependents\` int,
        \`citizenshipStatus\` varchar(50),
        \`employmentStatus\` varchar(50),
        \`employer\` varchar(255),
        \`monthlyIncome\` int,
        \`priorBankruptcy\` int,
        \`bankruptcyDate\` varchar(10),
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        \`lastSignedIn\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ users table created\n');

    // Create otpCodes table
    console.log('Creating otpCodes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`otpCodes\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`email\` varchar(320) NOT NULL,
        \`code\` varchar(6) NOT NULL,
        \`purpose\` enum('signup','login','loan_application') NOT NULL,
        \`expiresAt\` timestamp NOT NULL,
        \`verified\` int DEFAULT 0 NOT NULL,
        \`attempts\` int DEFAULT 0 NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`otpCodes_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ otpCodes table created\n');

    // Create loanApplications table
    console.log('Creating loanApplications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`loanApplications\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int NOT NULL,
        \`referenceNumber\` varchar(50) NOT NULL,
        \`fullName\` varchar(200) NOT NULL,
        \`email\` varchar(320) NOT NULL,
        \`phoneNumber\` varchar(20) NOT NULL,
        \`loanAmount\` int NOT NULL,
        \`loanPurpose\` varchar(255),
        \`status\` enum('submitted','approved','rejected','disbursed','completed','defaulted') NOT NULL DEFAULT 'submitted',
        \`approvalDate\` timestamp,
        \`disbursementDate\` timestamp,
        \`interestRate\` decimal(5,2),
        \`loanTerm\` int,
        \`monthlyPayment\` int,
        \`totalRepaymentAmount\` int,
        \`paymentVerified\` int DEFAULT 0,
        \`paymentVerifiedBy\` int,
        \`paymentVerifiedAt\` timestamp,
        \`paymentVerificationNotes\` text,
        \`paymentProofUrl\` mediumtext,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`loanApplications_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ loanApplications table created\n');

    // Create payments table
    console.log('Creating payments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`payments\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`loanApplicationId\` int NOT NULL,
        \`userId\` int NOT NULL,
        \`amount\` int NOT NULL,
        \`status\` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
        \`paymentMethod\` enum('credit_card','bank_transfer','crypto','check') NOT NULL DEFAULT 'credit_card',
        \`transactionId\` varchar(255),
        \`processor\` varchar(100),
        \`processorTransactionId\` varchar(255),
        \`metadata\` text,
        \`processedBy\` int,
        \`processedAt\` timestamp,
        \`principalAmount\` int,
        \`interestAmount\` int,
        \`feesAmount\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`payments_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ payments table created\n');

    // Create feeConfiguration table
    console.log('Creating feeConfiguration table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`feeConfiguration\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`calculationMode\` enum('percentage','fixed','tiered') NOT NULL DEFAULT 'percentage',
        \`percentageRate\` decimal(5,2),
        \`fixedFeeAmount\` int,
        \`isActive\` int NOT NULL DEFAULT 1,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`feeConfiguration_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ feeConfiguration table created\n');

    // Create disbursements table
    console.log('Creating disbursements table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`disbursements\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`loanApplicationId\` int NOT NULL,
        \`userId\` int NOT NULL,
        \`amount\` int NOT NULL,
        \`status\` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
        \`accountHolderName\` varchar(255) NOT NULL,
        \`accountNumber\` varchar(50) NOT NULL,
        \`routingNumber\` varchar(20) NOT NULL,
        \`transactionId\` varchar(255),
        \`failureReason\` text,
        \`adminNotes\` text,
        \`initiatedBy\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        \`completedAt\` timestamp,
        CONSTRAINT \`disbursements_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ disbursements table created\n');

    // Create systemSettings table
    console.log('Creating systemSettings table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`systemSettings\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`key\` varchar(100) NOT NULL UNIQUE,
        \`value\` text NOT NULL,
        \`type\` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
        \`category\` varchar(50),
        \`description\` text,
        \`isPublic\` int DEFAULT 0 NOT NULL,
        \`updatedBy\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`systemSettings_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ systemSettings table created\n');

    // Create notifications table
    console.log('Creating notifications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int NOT NULL,
        \`loanApplicationId\` int,
        \`type\` enum('loan_submitted','loan_approved','loan_rejected','payment_confirmed','loan_disbursed','payment_reminder','system_alert') NOT NULL,
        \`subject\` varchar(255) NOT NULL,
        \`message\` text NOT NULL,
        \`status\` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
        \`sentAt\` timestamp,
        \`readAt\` timestamp,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`notifications_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ notifications table created\n');

    // Create supportMessages table
    console.log('Creating supportMessages table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`supportMessages\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`userId\` int,
        \`senderName\` varchar(255) NOT NULL,
        \`senderEmail\` varchar(320) NOT NULL,
        \`senderPhone\` varchar(20),
        \`subject\` varchar(500) NOT NULL,
        \`message\` text NOT NULL,
        \`category\` enum('general','loan_inquiry','payment_issue','technical_support','complaint','other') NOT NULL DEFAULT 'general',
        \`status\` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
        \`assignedAgentId\` int,
        \`createdAt\` timestamp NOT NULL DEFAULT (now()),
        \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`supportMessages_id\` PRIMARY KEY(\`id\`)
      )
    `);
    console.log('✅ supportMessages table created\n');

    console.log('✅ All tables created successfully!');
    console.log('\n[Next Steps]');
    console.log('1. Redeploy your app on Render');
    console.log('2. Visit https://www.amerilendloan.com');
    console.log('3. Try logging in or creating a new account');

  } catch (error) {
    console.error('❌ Error creating tables:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeDatabase();
