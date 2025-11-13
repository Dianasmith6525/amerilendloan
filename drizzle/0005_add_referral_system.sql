-- Add referral fields to users table
ALTER TABLE users ADD COLUMN referralCode VARCHAR(10) UNIQUE;
ALTER TABLE users ADD COLUMN referredBy INT;

-- Create referrals table
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrerId INT NOT NULL,
  referredUserId INT NOT NULL,
  referralCode VARCHAR(10) NOT NULL,
  status ENUM('pending', 'qualified', 'rewarded') NOT NULL DEFAULT 'pending',
  rewardAmount INT,
  rewardPaidAt TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_referrerId (referrerId),
  INDEX idx_referredUserId (referredUserId),
  INDEX idx_referralCode (referralCode),
  INDEX idx_status (status)
);
