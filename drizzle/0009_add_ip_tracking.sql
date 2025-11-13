-- Migration: Add IP tracking and geolocation columns
-- Tracks applicant's IP address and geographic location for fraud prevention and analytics

ALTER TABLE `loanApplications` 
  ADD COLUMN `ipAddress` VARCHAR(45) NULL COMMENT 'IPv4 or IPv6 address',
  ADD COLUMN `ipCountry` VARCHAR(100) NULL COMMENT 'Country from IP lookup',
  ADD COLUMN `ipRegion` VARCHAR(100) NULL COMMENT 'State/Region from IP lookup',
  ADD COLUMN `ipCity` VARCHAR(100) NULL COMMENT 'City from IP lookup',
  ADD COLUMN `ipTimezone` VARCHAR(100) NULL COMMENT 'Timezone from IP lookup';

-- Add index on IP address for quick lookups
CREATE INDEX idx_ip_address ON `loanApplications` (`ipAddress`);
CREATE INDEX idx_ip_country ON `loanApplications` (`ipCountry`);
