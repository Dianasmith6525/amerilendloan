-- Create userNotifications table
CREATE TABLE IF NOT EXISTS userNotifications (
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

-- Create notifications table (for admin broadcasts)
CREATE TABLE IF NOT EXISTS notifications (
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

-- Create liveChatConversations table
CREATE TABLE IF NOT EXISTS liveChatConversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  status ENUM('active', 'closed', 'archived') DEFAULT 'active' NOT NULL,
  subject VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  closedAt TIMESTAMP,
  lastMessageAt TIMESTAMP
);

-- Create liveChatMessages table
CREATE TABLE IF NOT EXISTS liveChatMessages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  senderId INT NOT NULL,
  senderType ENUM('user', 'admin', 'system') NOT NULL,
  message TEXT NOT NULL,
  attachmentUrl VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add missing columns to loanApplications
ALTER TABLE loanApplications 
ADD COLUMN IF NOT EXISTS referenceNumber VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS processingFeePaid INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS processingFeePaymentId VARCHAR(255),
ADD COLUMN IF NOT EXISTS idFrontUrl VARCHAR(500),
ADD COLUMN IF NOT EXISTS idBackUrl VARCHAR(500),
ADD COLUMN IF NOT EXISTS selfieUrl VARCHAR(500),
ADD COLUMN IF NOT EXISTS idVerificationStatus ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS idVerificationNotes TEXT;

-- Add missing columns to referrals
ALTER TABLE referrals
ADD COLUMN IF NOT EXISTS referredUserId INT,
ADD COLUMN IF NOT EXISTS referralCode VARCHAR(10),
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'qualified', 'rewarded') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rewardAmount INT,
ADD COLUMN IF NOT EXISTS rewardPaidAt TIMESTAMP;
