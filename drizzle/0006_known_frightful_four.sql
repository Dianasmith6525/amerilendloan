CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`oldValue` text,
	`newValue` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `liveChatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`guestName` varchar(255),
	`guestEmail` varchar(320),
	`assignedAgentId` int,
	`status` enum('waiting','active','resolved','closed') NOT NULL DEFAULT 'waiting',
	`priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
	`subject` varchar(255),
	`category` enum('loan_inquiry','application_status','payment_issue','technical_support','general','other') NOT NULL DEFAULT 'general',
	`userRating` int,
	`userFeedback` text,
	`sessionId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`assignedAt` timestamp,
	`resolvedAt` timestamp,
	`closedAt` timestamp,
	CONSTRAINT `liveChatConversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `liveChatConversations_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `liveChatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int,
	`senderType` enum('user','agent','system') NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`messageType` enum('text','system','file') NOT NULL DEFAULT 'text',
	`content` text NOT NULL,
	`fileUrl` text,
	`fileName` varchar(255),
	`fileSize` int,
	`read` int NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `liveChatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('loan_status','payment_reminder','payment_received','disbursement','system','referral') NOT NULL,
	`read` int NOT NULL DEFAULT 0,
	`actionUrl` varchar(500),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(20);