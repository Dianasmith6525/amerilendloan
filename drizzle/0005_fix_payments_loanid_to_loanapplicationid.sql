-- Migration: Fix payments table schema to match codebase usage
-- 1. Rename loanId to loanApplicationId (consistency with loanApplications table)
-- 2. Add missing fields used by payment processing code
-- 3. Update enums to include values used in routers.ts

-- Step 1: Rename column from loanId to loanApplicationId
ALTER TABLE `payments` CHANGE COLUMN `loanId` `loanApplicationId` INT NOT NULL;

-- Step 2: Make transactionId nullable (pending payments don't have transaction IDs yet)
ALTER TABLE `payments` MODIFY COLUMN `transactionId` VARCHAR(100) UNIQUE;

-- Step 3: Add currency field (default USD)
ALTER TABLE `payments` ADD COLUMN `currency` VARCHAR(10) DEFAULT 'USD';

-- Step 4: Add payment provider enum
ALTER TABLE `payments` ADD COLUMN `paymentProvider` 
  ENUM('stripe', 'authorizenet', 'crypto', 'other') AFTER `paymentMethod`;

-- Step 5: Update payment method enum to include 'card'
ALTER TABLE `payments` MODIFY COLUMN `paymentMethod` 
  ENUM('card', 'credit_card', 'debit_card', 'bank_transfer', 'ach', 'crypto', 'cash', 'check', 'other') NOT NULL;

-- Step 6: Update status enum to include 'succeeded'
ALTER TABLE `payments` MODIFY COLUMN `status` 
  ENUM('pending', 'processing', 'completed', 'succeeded', 'failed', 'refunded', 'cancelled') 
  DEFAULT 'pending' NOT NULL;

-- Step 7: Add payment gateway field
ALTER TABLE `payments` ADD COLUMN `paymentIntentId` VARCHAR(255) AFTER `status`;

-- Step 8: Add card payment fields
ALTER TABLE `payments` ADD COLUMN `cardLast4` VARCHAR(4) AFTER `paymentIntentId`;
ALTER TABLE `payments` ADD COLUMN `cardBrand` VARCHAR(50) AFTER `cardLast4`;

-- Step 9: Add crypto payment fields
ALTER TABLE `payments` ADD COLUMN `cryptoCurrency` ENUM('BTC', 'ETH', 'USDT', 'USDC') AFTER `cardBrand`;
ALTER TABLE `payments` ADD COLUMN `cryptoAddress` VARCHAR(255) AFTER `cryptoCurrency`;
ALTER TABLE `payments` ADD COLUMN `cryptoAmount` VARCHAR(50) AFTER `cryptoAddress`;
ALTER TABLE `payments` ADD COLUMN `cryptoTxHash` VARCHAR(255) AFTER `cryptoAmount`;

-- Step 10: Add completedAt timestamp
ALTER TABLE `payments` ADD COLUMN `completedAt` TIMESTAMP NULL AFTER `paymentDate`;

-- Step 11: Modify paymentDate to have default value
ALTER TABLE `payments` MODIFY COLUMN `paymentDate` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

