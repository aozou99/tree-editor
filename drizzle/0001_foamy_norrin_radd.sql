CREATE TABLE `shares` (
	`id` text PRIMARY KEY NOT NULL,
	`tree_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`share_token` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`tree_id`) REFERENCES `trees`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shares_share_token_unique` ON `shares` (`share_token`);--> statement-breakpoint
CREATE INDEX `shares_share_token_idx` ON `shares` (`share_token`);--> statement-breakpoint
CREATE INDEX `shares_tree_id_idx` ON `shares` (`tree_id`);--> statement-breakpoint
CREATE INDEX `shares_user_id_idx` ON `shares` (`user_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_trees` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`r2_key` text NOT NULL,
	`last_saved` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_trees`("id", "user_id", "name", "description", "r2_key", "last_saved", "created_at", "updated_at") SELECT "id", "user_id", "name", "description", "r2_key", "last_saved", "created_at", "updated_at" FROM `trees`;--> statement-breakpoint
DROP TABLE `trees`;--> statement-breakpoint
ALTER TABLE `__new_trees` RENAME TO `trees`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `trees_user_id_idx` ON `trees` (`user_id`);