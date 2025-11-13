-- Drop all existing tables
DROP TABLE IF EXISTS liveChatMessages;
DROP TABLE IF EXISTS liveChatConversations;
DROP TABLE IF EXISTS userNotifications;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS submittedDocuments;
DROP TABLE IF EXISTS loanDocumentRequirements;
DROP TABLE IF EXISTS disbursements;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS legalAcceptances;
DROP TABLE IF EXISTS loanApplications;
DROP TABLE IF EXISTS referrals;
DROP TABLE IF EXISTS referralCodes;
DROP TABLE IF EXISTS otpCodes;
DROP TABLE IF EXISTS feeConfiguration;
DROP TABLE IF EXISTS fraudAuditLog;
DROP TABLE IF EXISTS auditLog;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE,
  name TEXT,
  email VARCHAR(320) UNIQUE,
  phone VARCHAR(20),
  passwordHash VARCHAR(255),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zipCode VARCHAR(10),
  middleInitial VARCHAR(1),
  dateOfBirth VARCHAR(10),
  ssn VARCHAR(11),
  idType VARCHAR(50),
  idNumber VARCHAR(100),
  maritalStatus VARCHAR(50),
  dependents INT,
  citizenshipStatus VARCHAR(50),
  employmentStatus VARCHAR(50),
  employer VARCHAR(255),
  monthlyIncome INT,
  priorBankruptcy INT,
  bankruptcyDate VARCHAR(10)
);

-- Create referrals table
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrerId INT NOT NULL,
  referredUserId INT,
  referralCode VARCHAR(10),
  status ENUM('pending', 'qualified', 'rewarded') DEFAULT 'pending' NOT NULL,
  rewardAmount INT,
  rewardPaidAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create OTP codes table
CREATE TABLE otpCodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  code VARCHAR(6) NOT NULL,
  purpose ENUM('signup', 'login', 'loan_application') NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  verified INT DEFAULT 0 NOT NULL,
  attempts INT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create legal acceptances table
CREATE TABLE legalAcceptances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  loanApplicationId INT,
  documentType ENUM('terms_of_service', 'privacy_policy', 'loan_agreement', 'esign_consent') NOT NULL,
  documentVersion VARCHAR(20) NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  acceptedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create loan applications table
CREATE TABLE loanApplications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  referenceNumber VARCHAR(20) UNIQUE,
  fullName VARCHAR(255),
  email VARCHAR(320),
  phone VARCHAR(20),
  dateOfBirth VARCHAR(10),
  ssn VARCHAR(11),
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zipCode VARCHAR(10),
  middleInitial VARCHAR(1),
  idType VARCHAR(50),
  idNumber VARCHAR(100),
  maritalStatus VARCHAR(50),
  dependents INT,
  citizenshipStatus VARCHAR(50),
  employmentStatus ENUM('employed', 'self_employed', 'unemployed', 'retired'),
  employer VARCHAR(255),
  monthlyIncome INT,
  loanType ENUM('personal', 'installment', 'short_term', 'auto', 'home_equity', 'heloc', 'student', 'business', 'debt_consolidation', 'mortgage', 'private_money', 'title', 'credit_builder', 'signature', 'peer_to_peer'),
  requestedAmount INT,
  loanPurpose TEXT,
  approvedAmount INT,
  processingFeeAmount INT,
  processingFeePaid INT DEFAULT 0,
  processingFeePaymentId VARCHAR(255),
  status ENUM('pending', 'under_review', 'approved', 'fee_pending', 'fee_paid', 'disbursed', 'rejected', 'cancelled') DEFAULT 'pending' NOT NULL,
  rejectionReason TEXT,
  adminNotes TEXT,
  idFrontUrl VARCHAR(500),
  idBackUrl VARCHAR(500),
  selfieUrl VARCHAR(500),
  idVerificationStatus ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  idVerificationNotes TEXT,
  priorBankruptcy INT,
  bankruptcyDate VARCHAR(10),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  approvedAt TIMESTAMP,
  disbursedAt TIMESTAMP
);

-- Create fee configuration table
CREATE TABLE feeConfiguration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loanType ENUM('personal', 'installment', 'short_term', 'auto', 'home_equity', 'heloc', 'student', 'business', 'debt_consolidation', 'mortgage', 'private_money', 'title', 'credit_builder', 'signature', 'peer_to_peer') NOT NULL UNIQUE,
  feePercentage DECIMAL(5,2) NOT NULL,
  minimumFee INT,
  maximumFee INT,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create payments table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loanApplicationId INT NOT NULL,
  userId INT NOT NULL,
  amount INT NOT NULL,
  paymentMethod ENUM('card', 'crypto') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending' NOT NULL,
  transactionId VARCHAR(255),
  cryptoAddress VARCHAR(255),
  cryptoCurrency VARCHAR(20),
  cryptoAmount VARCHAR(50),
  cryptoTxHash VARCHAR(255),
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completedAt TIMESTAMP
);

-- Create disbursements table
CREATE TABLE disbursements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loanApplicationId INT NOT NULL,
  userId INT NOT NULL,
  amount INT NOT NULL,
  disbursementMethod ENUM('ach', 'wire', 'check', 'card') NOT NULL,
  accountNumber VARCHAR(50),
  routingNumber VARCHAR(20),
  accountHolderName VARCHAR(255),
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  transactionId VARCHAR(255),
  failureReason TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completedAt TIMESTAMP
);

-- Create notifications table (admin broadcasts)
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') NOT NULL,
  targetAudience ENUM('all', 'active_borrowers', 'pending_applications', 'specific_users') NOT NULL,
  targetUserIds JSON,
  expiresAt TIMESTAMP,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user notifications table
CREATE TABLE userNotifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') NOT NULL,
  `read` INT DEFAULT 0 NOT NULL,
  actionUrl VARCHAR(500),
  metadata JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create live chat conversations table
CREATE TABLE liveChatConversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  status ENUM('active', 'closed', 'archived') DEFAULT 'active' NOT NULL,
  subject VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  closedAt TIMESTAMP,
  lastMessageAt TIMESTAMP
);

-- Create live chat messages table
CREATE TABLE liveChatMessages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  senderId INT NOT NULL,
  senderType ENUM('user', 'admin', 'system') NOT NULL,
  message TEXT NOT NULL,
  attachmentUrl VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Insert default fee configuration
INSERT INTO feeConfiguration (loanType, feePercentage, minimumFee, maximumFee, description) VALUES
('personal', 5.00, 2500, 50000, 'Processing fee for personal loans'),
('installment', 5.00, 2500, 50000, 'Processing fee for installment loans'),
('short_term', 5.00, 2500, 50000, 'Processing fee for short-term loans'),
('business', 5.00, 5000, 100000, 'Processing fee for business loans'),
('auto', 5.00, 2500, 50000, 'Processing fee for auto loans'),
('home_equity', 5.00, 5000, 100000, 'Processing fee for home equity loans'),
('debt_consolidation', 5.00, 2500, 50000, 'Processing fee for debt consolidation loans');
