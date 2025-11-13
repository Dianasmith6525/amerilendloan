CREATE TABLE `draftApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`userId` int,
	`draftData` mediumtext NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `draftApplications_id` PRIMARY KEY(`id`)
);
