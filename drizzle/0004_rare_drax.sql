CREATE TABLE `legalAcceptances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`loanApplicationId` int,
	`documentType` enum('terms_of_service','privacy_policy','loan_agreement','esign_consent') NOT NULL,
	`documentVersion` varchar(20) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legalAcceptances_id` PRIMARY KEY(`id`)
);
