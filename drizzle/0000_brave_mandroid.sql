CREATE TABLE `niches` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`demand` integer NOT NULL,
	`competition` integer NOT NULL,
	`urgency` integer NOT NULL,
	`monetization` integer NOT NULL,
	`evidence` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_niches_owner_updated` ON `niches` (`owner_id`,`updated_at`);