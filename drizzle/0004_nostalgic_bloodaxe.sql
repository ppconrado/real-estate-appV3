CREATE TABLE `propertyViewings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`userId` int NOT NULL,
	`visitorName` varchar(255) NOT NULL,
	`visitorEmail` varchar(320) NOT NULL,
	`visitorPhone` varchar(20),
	`viewingDate` timestamp NOT NULL,
	`viewingTime` varchar(10) NOT NULL,
	`duration` int NOT NULL DEFAULT 30,
	`notes` text,
	`status` enum('scheduled','confirmed','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertyViewings_id` PRIMARY KEY(`id`)
);
