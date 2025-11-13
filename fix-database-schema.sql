-- Fix database schema to match code requirements
-- Add missing columns to loanApplications and payments tables

-- Add missing columns to loanApplications table
ALTER TABLE loanApplications 
ADD COLUMN paymentVerified INT NOT NULL DEFAULT 0 COMMENT '0 = not verified, 1 = verified by admin',
ADD COLUMN paymentVerifiedBy INT NULL COMMENT 'Admin user ID who verified payment',
ADD COLUMN paymentVerifiedAt TIMESTAMP NULL COMMENT 'When payment was verified',
ADD COLUMN paymentVerificationNotes TEXT NULL COMMENT 'Admin notes on payment verification',
ADD COLUMN paymentProofUrl MEDIUMTEXT NULL COMMENT 'Screenshot/proof of payment uploaded by user';

-- Add missing currency column to payments table
ALTER TABLE payments 
ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'USD' COMMENT 'Currency code (USD, BTC, ETH, etc.)';
