ALTER TABLE `payments` MODIFY COLUMN `paymentProvider` enum('stripe','authorizenet','crypto') NOT NULL DEFAULT 'stripe';--> statement-breakpoint
ALTER TABLE `payments` ADD `paymentMethod` enum('card','crypto') DEFAULT 'card' NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `cardLast4` varchar(4);--> statement-breakpoint
ALTER TABLE `payments` ADD `cardBrand` varchar(20);--> statement-breakpoint
ALTER TABLE `payments` ADD `cryptoCurrency` varchar(10);--> statement-breakpoint
ALTER TABLE `payments` ADD `cryptoAddress` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `cryptoTxHash` varchar(255);--> statement-breakpoint
ALTER TABLE `payments` ADD `cryptoAmount` varchar(50);