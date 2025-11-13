CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`loanApplicationId` int,
	`type` enum('loan_submitted','loan_approved','loan_rejected','payment_confirmed','loan_disbursed','payment_reminder','general') NOT NULL,
	`channel` enum('email','sms','push') NOT NULL DEFAULT 'email',
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(255),
	`message` text NOT NULL,
	`status` enum('pending','sent','delivered','failed','bounced') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`errorMessage` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(10) NOT NULL,
	`status` enum('pending','qualified','rewarded') NOT NULL DEFAULT 'pending',
	`rewardAmount` int,
	`rewardPaidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `otpCodes` MODIFY COLUMN `purpose` enum('signup','login','loan_application') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `referenceNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `processingFeePaid` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `processingFeePaymentId` int;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `idFrontUrl` text;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `idBackUrl` text;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `selfieUrl` text;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `idVerificationStatus` enum('pending','verified','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `loanApplications` ADD `idVerificationNotes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `referralCode` varchar(10);--> statement-breakpoint
ALTER TABLE `users` ADD `referredBy` int;--> statement-breakpoint
ALTER TABLE `loanApplications` ADD CONSTRAINT `loanApplications_referenceNumber_unique` UNIQUE(`referenceNumber`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referralCode_unique` UNIQUE(`referralCode`);