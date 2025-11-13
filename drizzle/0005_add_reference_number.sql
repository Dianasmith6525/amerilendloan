-- Add reference number column to loan applications
ALTER TABLE `loanApplications` 
ADD COLUMN `referenceNumber` VARCHAR(20) UNIQUE AFTER `userId`;

-- Create index for faster lookups
CREATE INDEX idx_referenceNumber ON `loanApplications`(`referenceNumber`);
