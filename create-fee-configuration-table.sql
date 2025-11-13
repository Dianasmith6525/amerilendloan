-- Create feeConfiguration table if it doesn't exist
CREATE TABLE IF NOT EXISTS `feeConfiguration` (
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

-- Insert a default active fee configuration if the table is empty
INSERT INTO `feeConfiguration` (`calculationMode`, `percentageRate`, `fixedFeeAmount`, `isActive`)
SELECT 'percentage', 200, 200, 1
WHERE NOT EXISTS (SELECT 1 FROM `feeConfiguration` LIMIT 1);
