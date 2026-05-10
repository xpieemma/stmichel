CREATE TABLE `activity_feed` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`metadata` text,
	`created_at` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `admins` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`display_name` text,
	`credential_id` text,
	`public_key` text,
	`counter` integer DEFAULT 0,
	`password` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_username_unique` ON `admins` (`username`);--> statement-breakpoint
CREATE TABLE `album_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`album_id` integer,
	`image_url` text NOT NULL,
	`blur_hash` text,
	`caption` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`album_id`) REFERENCES `albums`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `albums` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_image_url` text,
	`created_at` integer,
	`updated_at` integer,
	`published` integer DEFAULT 1,
	`blur_hash` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `albums_slug_unique` ON `albums` (`slug`);--> statement-breakpoint
CREATE TABLE `city_info` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`content_fr` text,
	`content_ht` text,
	`content_es` text,
	`content_en` text,
	`image_url` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `city_info_key_unique` ON `city_info` (`key`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`date` text NOT NULL,
	`time` text,
	`location` text,
	`lat` text,
	`lng` text,
	`category` text DEFAULT 'community',
	`image_url` text,
	`blur_hash` text,
	`type` text DEFAULT 'event',
	`created_at` integer,
	`updated_at` integer,
	`published` integer DEFAULT 1,
	`version` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `events_slug_unique` ON `events` (`slug`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer,
	`event_title` text,
	`rating` integer,
	`comment` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `match_photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer,
	`image_url` text NOT NULL,
	`blur_hash` text,
	`caption` text,
	`sort_order` integer DEFAULT 0,
	`created_at` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`home_team` text NOT NULL,
	`away_team` text NOT NULL,
	`match_date` text NOT NULL,
	`match_time` text,
	`location` text,
	`description` text,
	`home_score` integer,
	`away_score` integer,
	`status` text DEFAULT 'upcoming',
	`cover_image_url` text,
	`created_at` integer,
	`updated_at` integer,
	`published` integer DEFAULT 1,
	`version` integer DEFAULT 1
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_slug_unique` ON `matches` (`slug`);--> statement-breakpoint
CREATE TABLE `pending_sync` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer,
	`attempts` integer DEFAULT 0,
	`last_attempt` integer
);
--> statement-breakpoint
CREATE TABLE `stamps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nonce` text NOT NULL,
	`event_id` integer,
	`earned_at` integer,
	`synced` integer DEFAULT 0,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `stamps_nonce_unique` ON `stamps` (`nonce`);