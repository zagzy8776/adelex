CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_user_id_unique` ON `admins` (`user_id`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text NOT NULL,
	`status` text NOT NULL,
	`location` text NOT NULL,
	`note` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`source` text DEFAULT 'admin' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_shipment_idx` ON `events` (`shipment_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`origin` text NOT NULL,
	`destination` text NOT NULL,
	`service` text NOT NULL,
	`description` text NOT NULL,
	`weight` real NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`contact_phone` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`business_hours` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`recipient_name` text NOT NULL,
	`recipient_email` text DEFAULT '' NOT NULL,
	`recipient_phone` text DEFAULT '' NOT NULL,
	`description` text NOT NULL,
	`service` text NOT NULL,
	`origin` text NOT NULL,
	`destination` text NOT NULL,
	`origin_lat` real NOT NULL,
	`origin_lng` real NOT NULL,
	`destination_lat` real NOT NULL,
	`destination_lng` real NOT NULL,
	`current_lat` real NOT NULL,
	`current_lng` real NOT NULL,
	`current_location` text NOT NULL,
	`status` text DEFAULT 'booked' NOT NULL,
	`eta` text DEFAULT '' NOT NULL,
	`weight` real DEFAULT 0 NOT NULL,
	`pieces` integer DEFAULT 1 NOT NULL,
	`location_source` text DEFAULT 'admin' NOT NULL,
	`location_updated_at` text NOT NULL,
	`driver_token_hash` text,
	`driver_token_expires_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipments_code_unique` ON `shipments` (`code`);--> statement-breakpoint
CREATE INDEX `shipments_created_idx` ON `shipments` (`created_at`);