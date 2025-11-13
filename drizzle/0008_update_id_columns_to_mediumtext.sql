-- Migration: Update ID verification columns to MEDIUMTEXT for base64 storage
-- This allows storing images up to 16MB (base64 encoded)

ALTER TABLE `loanApplications` 
  MODIFY COLUMN `idFrontUrl` MEDIUMTEXT,
  MODIFY COLUMN `idBackUrl` MEDIUMTEXT,
  MODIFY COLUMN `selfieUrl` MEDIUMTEXT;
