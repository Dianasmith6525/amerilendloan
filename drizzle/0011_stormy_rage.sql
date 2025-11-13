CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `systemSettings` DROP INDEX `systemSettings_settingKey_unique`;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `paymentVerified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `paymentVerifiedBy` int;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `paymentVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `paymentVerificationNotes` text;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `paymentProofUrl` mediumtext;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `key` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `value` text NOT NULL;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `type` enum('string','number','boolean','json') DEFAULT 'string' NOT NULL;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD `isPublic` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `systemSettings` ADD CONSTRAINT `systemSettings_key_unique` UNIQUE(`key`);--> statement-breakpoint
ALTER TABLE `systemSettings` DROP COLUMN `settingKey`;--> statement-breakpoint
ALTER TABLE `systemSettings` DROP COLUMN `settingValue`;--> statement-breakpoint
ALTER TABLE `systemSettings` DROP COLUMN `category`;