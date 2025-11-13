-- Live Chat Conversations Table
CREATE TABLE IF NOT EXISTS `liveChatConversations` (
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
  `sessionId` varchar(100) UNIQUE,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `assignedAt` timestamp,
  `resolvedAt` timestamp,
  `closedAt` timestamp,
  CONSTRAINT `liveChatConversations_id` PRIMARY KEY(`id`)
);

-- Live Chat Messages Table
CREATE TABLE IF NOT EXISTS `liveChatMessages` (
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

-- Audit Log Table
CREATE TABLE IF NOT EXISTS `auditLog` (
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
