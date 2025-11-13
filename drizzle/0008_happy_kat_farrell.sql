CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`description` text,
	`category` varchar(50) NOT NULL,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `payments` RENAME COLUMN `paymentMethodId` TO `paymentDate`;--> statement-breakpoint
ALTER TABLE `loanApplications` MODIFY COLUMN `idFrontUrl` mediumtext;--> statement-breakpoint
ALTER TABLE `loanApplications` MODIFY COLUMN `idBackUrl` mediumtext;--> statement-breakpoint
ALTER TABLE `loanApplications` MODIFY COLUMN `selfieUrl` mediumtext;--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `currency` varchar(10) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `paymentProvider` enum('stripe','authorizenet','crypto','other');--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `paymentMethod` enum('card','credit_card','debit_card','bank_transfer','ach','crypto','cash','check','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `paymentDate` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `cardBrand` varchar(50);--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `cryptoCurrency` enum('BTC','ETH','USDT','USDC');--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `status` enum('pending','processing','completed','succeeded','failed','refunded','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `payments` ADD `transactionId` varchar(100);--> statement-breakpoint
ALTER TABLE `payments` ADD `reference` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `description` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `principalAmount` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `interestAmount` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `feesAmount` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `processor` varchar(100);--> statement-breakpoint
ALTER TABLE `payments` ADD `processorTransactionId` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `processedBy` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `processedAt` timestamp;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_transactionId_unique` UNIQUE(`transactionId`);--> statement-breakpoint
ALTER TABLE `payments` DROP COLUMN `failureReason`;