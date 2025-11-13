CREATE TABLE `supportMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`senderName` varchar(255) NOT NULL,
	`senderEmail` varchar(320) NOT NULL,
	`senderPhone` varchar(20),
	`subject` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`category` enum('general','loan_inquiry','payment_issue','technical_support','complaint','other') NOT NULL DEFAULT 'general',
	`status` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`adminResponse` text,
	`respondedBy` int,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `phoneNumber` TO `phone`;--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `password` TO `passwordHash`;--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN `referralCode` TO `street`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_referralCode_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `street` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `state` varchar(2);--> statement-breakpoint
ALTER TABLE `users` ADD `zipCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `middleInitial` varchar(1);--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `ssn` varchar(11);--> statement-breakpoint
ALTER TABLE `users` ADD `idType` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `idNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `maritalStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `dependents` int;--> statement-breakpoint
ALTER TABLE `users` ADD `citizenshipStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `employmentStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `employer` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `monthlyIncome` int;--> statement-breakpoint
ALTER TABLE `users` ADD `priorBankruptcy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `bankruptcyDate` varchar(10);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `referredBy`;