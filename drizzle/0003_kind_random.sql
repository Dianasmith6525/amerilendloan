CREATE TABLE `otpCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(6) NOT NULL,
	`purpose` enum('signup','login') NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`verified` int NOT NULL DEFAULT 0,
	`attempts` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otpCodes_id` PRIMARY KEY(`id`)
);
