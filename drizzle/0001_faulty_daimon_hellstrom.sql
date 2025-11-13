CREATE TABLE `disbursements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanApplicationId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`accountHolderName` varchar(255) NOT NULL,
	`accountNumber` varchar(50) NOT NULL,
	`routingNumber` varchar(20) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(255),
	`failureReason` text,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	`initiatedBy` int,
	CONSTRAINT `disbursements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feeConfiguration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`calculationMode` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
	`percentageRate` int NOT NULL DEFAULT 200,
	`fixedFeeAmount` int NOT NULL DEFAULT 200,
	`isActive` int NOT NULL DEFAULT 1,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feeConfiguration_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `loanApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`dateOfBirth` varchar(10) NOT NULL,
	`ssn` varchar(11) NOT NULL,
	`street` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zipCode` varchar(10) NOT NULL,
	`employmentStatus` enum('employed','self_employed','unemployed','retired') NOT NULL,
	`employer` varchar(255),
	`monthlyIncome` int NOT NULL,
	`loanType` enum('installment','short_term') NOT NULL,
	`requestedAmount` int NOT NULL,
	`loanPurpose` text NOT NULL,
	`approvedAmount` int,
	`processingFeeAmount` int,
	`status` enum('pending','under_review','approved','fee_pending','fee_paid','disbursed','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approvedAt` timestamp,
	`disbursedAt` timestamp,
	CONSTRAINT `loanApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`loanApplicationId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`paymentProvider` varchar(50) NOT NULL DEFAULT 'stripe',
	`paymentIntentId` varchar(255),
	`paymentMethodId` varchar(255),
	`status` enum('pending','processing','succeeded','failed','cancelled') NOT NULL DEFAULT 'pending',
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
