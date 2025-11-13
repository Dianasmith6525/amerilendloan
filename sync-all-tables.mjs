import { config } from "dotenv";
import { getDb } from "./server/db.ts";
import { sql } from "drizzle-orm";

// Load environment variables
config();

async function syncAllTables() {
  try {
    console.log("[DB] Starting database sync...\n");
    
    const db = await getDb();
    
    // Create all tables with IF NOT EXISTS
    const tables = [
      {
        name: "users",
        sql: `CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`openId\` varchar(255),
          \`email\` varchar(320) NOT NULL,
          \`firstName\` varchar(100),
          \`lastName\` varchar(100),
          \`phoneNumber\` varchar(20),
          \`dateOfBirth\` date,
          \`ssn\` varchar(11),
          \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
          \`isEmailVerified\` int NOT NULL DEFAULT 0,
          \`isPhoneVerified\` int NOT NULL DEFAULT 0,
          \`profilePictureUrl\` varchar(500),
          \`address\` varchar(255),
          \`city\` varchar(100),
          \`state\` varchar(50),
          \`zipCode\` varchar(10),
          \`country\` varchar(100) DEFAULT 'United States',
          \`employmentStatus\` varchar(50),
          \`monthlyIncome\` int,
          \`idVerificationStatus\` enum('pending','verified','rejected') DEFAULT 'pending',
          \`idFrontUrl\` varchar(500),
          \`idBackUrl\` varchar(500),
          \`selfieUrl\` varchar(500),
          \`referralCode\` varchar(20),
          \`lastLoginAt\` timestamp,
          \`lastLoginIp\` varchar(45),
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
          CONSTRAINT \`users_email_unique\` UNIQUE(\`email\`),
          CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`),
          CONSTRAINT \`users_referralCode_unique\` UNIQUE(\`referralCode\`)
        )`
      },
      {
        name: "referrals",
        sql: `CREATE TABLE IF NOT EXISTS \`referrals\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`referrerId\` int NOT NULL,
          \`referredUserId\` int NOT NULL,
          \`referralCode\` varchar(20) NOT NULL,
          \`status\` enum('pending','completed','rewarded') NOT NULL DEFAULT 'pending',
          \`rewardAmount\` int DEFAULT 0,
          \`rewardedAt\` timestamp,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`referrals_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "otpCodes",
        sql: `CREATE TABLE IF NOT EXISTS \`otpCodes\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`email\` varchar(320) NOT NULL,
          \`code\` varchar(6) NOT NULL,
          \`expiresAt\` timestamp NOT NULL,
          \`verified\` int NOT NULL DEFAULT 0,
          \`attempts\` int NOT NULL DEFAULT 0,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`lastAttemptAt\` timestamp,
          CONSTRAINT \`otpCodes_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "legalAcceptances",
        sql: `CREATE TABLE IF NOT EXISTS \`legalAcceptances\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`loanApplicationId\` int,
          \`documentType\` enum('terms_of_service','privacy_policy','loan_agreement','esign_consent') NOT NULL,
          \`documentVersion\` varchar(20) NOT NULL DEFAULT '1.0',
          \`acceptedAt\` timestamp NOT NULL DEFAULT (now()),
          \`ipAddress\` varchar(45),
          \`userAgent\` text,
          CONSTRAINT \`legalAcceptances_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "loanApplications",
        sql: `CREATE TABLE IF NOT EXISTS \`loanApplications\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`referenceNumber\` varchar(50) NOT NULL,
          \`fullName\` varchar(200) NOT NULL,
          \`email\` varchar(320) NOT NULL,
          \`phoneNumber\` varchar(20) NOT NULL,
          \`dateOfBirth\` date NOT NULL,
          \`ssn\` varchar(11) NOT NULL,
          \`loanAmount\` int NOT NULL,
          \`loanPurpose\` varchar(255) NOT NULL,
          \`loanTerm\` int NOT NULL,
          \`employmentStatus\` varchar(50) NOT NULL,
          \`employerName\` varchar(200),
          \`jobTitle\` varchar(100),
          \`monthlyIncome\` int NOT NULL,
          \`address\` varchar(255) NOT NULL,
          \`city\` varchar(100) NOT NULL,
          \`state\` varchar(50) NOT NULL,
          \`zipCode\` varchar(10) NOT NULL,
          \`country\` varchar(100) NOT NULL DEFAULT 'United States',
          \`idFrontUrl\` varchar(500) NOT NULL,
          \`idBackUrl\` varchar(500) NOT NULL,
          \`selfieUrl\` varchar(500) NOT NULL,
          \`status\` enum('pending','under_review','approved','rejected','disbursed','completed','cancelled') NOT NULL DEFAULT 'pending',
          \`reviewNotes\` text,
          \`reviewedBy\` int,
          \`reviewedAt\` timestamp,
          \`approvedAmount\` int,
          \`interestRate\` int,
          \`monthlyPayment\` int,
          \`totalRepayment\` int,
          \`disbursedAt\` timestamp,
          \`disbursementMethod\` varchar(50),
          \`bankAccountLast4\` varchar(4),
          \`creditScore\` int,
          \`riskAssessment\` enum('low','medium','high'),
          \`submittedIp\` varchar(45),
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`loanApplications_id\` PRIMARY KEY(\`id\`),
          CONSTRAINT \`loanApplications_referenceNumber_unique\` UNIQUE(\`referenceNumber\`)
        )`
      },
      {
        name: "feeConfiguration",
        sql: `CREATE TABLE IF NOT EXISTS \`feeConfiguration\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`calculationMode\` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
          \`percentageRate\` int NOT NULL DEFAULT 200,
          \`fixedFeeAmount\` int NOT NULL DEFAULT 200,
          \`isActive\` int NOT NULL DEFAULT 1,
          \`updatedBy\` int,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`feeConfiguration_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "disbursements",
        sql: `CREATE TABLE IF NOT EXISTS \`disbursements\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`loanApplicationId\` int NOT NULL,
          \`userId\` int NOT NULL,
          \`amount\` int NOT NULL,
          \`method\` enum('bank_transfer','check','crypto') NOT NULL DEFAULT 'bank_transfer',
          \`status\` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
          \`bankAccountNumber\` varchar(255),
          \`routingNumber\` varchar(255),
          \`checkNumber\` varchar(50),
          \`cryptoAddress\` varchar(255),
          \`cryptoCurrency\` varchar(10),
          \`transactionHash\` varchar(255),
          \`processedAt\` timestamp,
          \`completedAt\` timestamp,
          \`failureReason\` text,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`disbursements_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "notifications",
        sql: `CREATE TABLE IF NOT EXISTS \`notifications\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`loanApplicationId\` int,
          \`type\` enum('loan_submitted','loan_approved','loan_rejected','payment_confirmed','loan_disbursed','payment_reminder','general') NOT NULL,
          \`channel\` enum('email','sms','push') NOT NULL DEFAULT 'email',
          \`recipient\` varchar(320) NOT NULL,
          \`subject\` varchar(255),
          \`message\` text NOT NULL,
          \`status\` enum('pending','sent','delivered','failed','bounced') NOT NULL DEFAULT 'pending',
          \`sentAt\` timestamp,
          \`deliveredAt\` timestamp,
          \`errorMessage\` text,
          \`metadata\` text,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`notifications_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "userNotifications",
        sql: `CREATE TABLE IF NOT EXISTS \`userNotifications\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`type\` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
          \`title\` varchar(255) NOT NULL,
          \`message\` text NOT NULL,
          \`link\` varchar(500),
          \`isRead\` int NOT NULL DEFAULT 0,
          \`readAt\` timestamp,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`userNotifications_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "liveChatConversations",
        sql: `CREATE TABLE IF NOT EXISTS \`liveChatConversations\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int NOT NULL,
          \`agentId\` int,
          \`status\` enum('waiting','active','resolved','closed') NOT NULL DEFAULT 'waiting',
          \`subject\` varchar(255),
          \`priority\` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
          \`category\` varchar(100),
          \`tags\` text,
          \`rating\` int,
          \`feedbackComment\` text,
          \`assignedAt\` timestamp,
          \`resolvedAt\` timestamp,
          \`closedAt\` timestamp,
          \`lastMessageAt\` timestamp,
          \`metadata\` text,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`liveChatConversations_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "liveChatMessages",
        sql: `CREATE TABLE IF NOT EXISTS \`liveChatMessages\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`conversationId\` int NOT NULL,
          \`senderId\` int NOT NULL,
          \`senderType\` enum('user','agent','system') NOT NULL,
          \`messageType\` enum('text','file','image','system') NOT NULL DEFAULT 'text',
          \`content\` text NOT NULL,
          \`fileUrl\` varchar(500),
          \`fileName\` varchar(255),
          \`fileSize\` int,
          \`isRead\` int NOT NULL DEFAULT 0,
          \`readAt\` timestamp,
          \`metadata\` text,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`liveChatMessages_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "auditLog",
        sql: `CREATE TABLE IF NOT EXISTS \`auditLog\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int,
          \`action\` varchar(100) NOT NULL,
          \`entityType\` varchar(100),
          \`entityId\` int,
          \`changes\` text,
          \`ipAddress\` varchar(45),
          \`userAgent\` text,
          \`metadata\` text,
          \`severity\` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          CONSTRAINT \`auditLog_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "supportMessages",
        sql: `CREATE TABLE IF NOT EXISTS \`supportMessages\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int,
          \`name\` varchar(200) NOT NULL,
          \`email\` varchar(320) NOT NULL,
          \`subject\` varchar(255) NOT NULL,
          \`message\` text NOT NULL,
          \`status\` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
          \`priority\` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
          \`assignedTo\` int,
          \`response\` text,
          \`respondedAt\` timestamp,
          \`ipAddress\` varchar(45),
          \`userAgent\` text,
          \`attachments\` text,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`supportMessages_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "payments",
        sql: `CREATE TABLE IF NOT EXISTS \`payments\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`loanApplicationId\` int NOT NULL,
          \`userId\` int NOT NULL,
          \`amount\` int NOT NULL,
          \`currency\` varchar(3) NOT NULL DEFAULT 'USD',
          \`paymentMethod\` enum('card','bank_transfer','crypto','cash') NOT NULL,
          \`status\` enum('pending','processing','completed','failed','refunded','cancelled') NOT NULL DEFAULT 'pending',
          \`transactionId\` varchar(255),
          \`cardLast4\` varchar(4),
          \`cardBrand\` varchar(50),
          \`bankName\` varchar(200),
          \`accountLast4\` varchar(4),
          \`cryptoCurrency\` varchar(10),
          \`cryptoAddress\` varchar(255),
          \`cryptoTransactionHash\` varchar(255),
          \`cryptoAmount\` varchar(50),
          \`cryptoExchangeRate\` varchar(50),
          \`processorFee\` int,
          \`netAmount\` int,
          \`metadata\` text,
          \`errorMessage\` text,
          \`ipAddress\` varchar(45),
          \`userAgent\` text,
          \`receiptUrl\` varchar(500),
          \`refundedAmount\` int,
          \`refundedAt\` timestamp,
          \`refundReason\` text,
          \`paidAt\` timestamp,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`payments_id\` PRIMARY KEY(\`id\`)
        )`
      },
      {
        name: "systemSettings",
        sql: `CREATE TABLE IF NOT EXISTS \`systemSettings\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`key\` varchar(100) NOT NULL,
          \`value\` text NOT NULL,
          \`type\` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
          \`description\` text,
          \`isPublic\` int NOT NULL DEFAULT 0,
          \`updatedBy\` int,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`systemSettings_id\` PRIMARY KEY(\`id\`),
          CONSTRAINT \`systemSettings_key_unique\` UNIQUE(\`key\`)
        )`
      },
      {
        name: "draftApplications",
        sql: `CREATE TABLE IF NOT EXISTS \`draftApplications\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`userId\` int,
          \`sessionId\` varchar(255) NOT NULL,
          \`email\` varchar(320),
          \`formData\` text NOT NULL,
          \`currentStep\` int NOT NULL DEFAULT 1,
          \`expiresAt\` timestamp NOT NULL,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`draftApplications_id\` PRIMARY KEY(\`id\`),
          CONSTRAINT \`draftApplications_sessionId_unique\` UNIQUE(\`sessionId\`)
        )`
      }
    ];

    // Create each table
    for (const table of tables) {
      try {
        await db.execute(sql.raw(table.sql));
        console.log(`✓ ${table.name}`);
      } catch (error) {
        console.error(`✗ ${table.name}:`, error.message);
      }
    }

    // Insert default fee configuration if not exists
    console.log("\n[DB] Inserting default data...");
    try {
      await db.execute(sql.raw(`
        INSERT INTO \`feeConfiguration\` (\`calculationMode\`, \`percentageRate\`, \`fixedFeeAmount\`, \`isActive\`)
        SELECT 'percentage', 200, 200, 1
        WHERE NOT EXISTS (SELECT 1 FROM \`feeConfiguration\` WHERE \`isActive\` = 1 LIMIT 1)
      `));
      console.log("✓ Default fee configuration");
    } catch (error) {
      console.log("- Fee configuration already exists");
    }

    console.log("\n[DB] ✓ Database sync completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n[DB] ✗ Error syncing database:", error);
    process.exit(1);
  }
}

syncAllTables();
