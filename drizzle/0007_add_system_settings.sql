-- Add system settings table for configuration management
CREATE TABLE IF NOT EXISTS `systemSettings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `settingKey` varchar(100) NOT NULL UNIQUE,
  `settingValue` text,
  `description` text,
  `category` varchar(50) NOT NULL,
  `updatedBy` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for faster category lookups
CREATE INDEX `idx_category` ON `systemSettings`(`category`);

-- Insert default crypto wallet addresses from environment variables
-- These can be updated via the admin interface
INSERT INTO `systemSettings` (`settingKey`, `settingValue`, `description`, `category`, `updatedBy`)
VALUES 
  ('WALLET_ADDRESS_BTC', '', 'Bitcoin wallet address for receiving payments', 'crypto', NULL),
  ('WALLET_ADDRESS_ETH', '', 'Ethereum wallet address for receiving payments', 'crypto', NULL),
  ('WALLET_ADDRESS_USDT', '', 'USDT wallet address for receiving payments', 'crypto', NULL),
  ('WALLET_ADDRESS_USDC', '', 'USDC wallet address for receiving payments', 'crypto', NULL)
ON DUPLICATE KEY UPDATE `settingKey` = `settingKey`;
