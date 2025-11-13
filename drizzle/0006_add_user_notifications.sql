-- Add userNotifications table for in-app notifications
CREATE TABLE IF NOT EXISTS userNotifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('loan_status', 'payment_reminder', 'payment_received', 'disbursement', 'system', 'referral') NOT NULL,
  `read` INT NOT NULL DEFAULT 0,
  actionUrl VARCHAR(500),
  metadata TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_read (userId, `read`)
);
