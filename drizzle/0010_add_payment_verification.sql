-- Add payment verification fields to loanApplications table
ALTER TABLE `loanApplications`
ADD COLUMN `paymentVerified` int NOT NULL DEFAULT 0 COMMENT '0 = not verified, 1 = verified by admin',
ADD COLUMN `paymentVerifiedBy` int COMMENT 'Admin user ID who verified payment',
ADD COLUMN `paymentVerifiedAt` timestamp COMMENT 'When payment was verified',
ADD COLUMN `paymentVerificationNotes` text COMMENT 'Admin notes on payment verification',
ADD COLUMN `paymentProofUrl` mediumtext COMMENT 'Optional: Screenshot/proof of payment uploaded by user';

-- Add index for faster queries on payment verification status
CREATE INDEX `idx_payment_verified` ON `loanApplications` (`paymentVerified`);
CREATE INDEX `idx_payment_verified_by` ON `loanApplications` (`paymentVerifiedBy`);
