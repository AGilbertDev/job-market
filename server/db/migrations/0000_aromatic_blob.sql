CREATE TABLE `job_postings` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`source_url` text NOT NULL,
	`title` text NOT NULL,
	`role` text,
	`seniority` text,
	`company` text,
	`country` text,
	`region` text,
	`city` text,
	`work_mode` text,
	`salary_min` real,
	`salary_max` real,
	`salary_currency` text,
	`salary_period` text DEFAULT 'year',
	`salary_is_estimated` integer DEFAULT 0,
	`tags` text,
	`description_excerpt` text,
	`posted_at` text,
	`ingested_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_seen_at` text DEFAULT (datetime('now')) NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_jobs_role` ON `job_postings` (`role`);--> statement-breakpoint
CREATE INDEX `idx_jobs_seniority` ON `job_postings` (`seniority`);--> statement-breakpoint
CREATE INDEX `idx_jobs_country` ON `job_postings` (`country`);--> statement-breakpoint
CREATE INDEX `idx_jobs_region` ON `job_postings` (`region`);--> statement-breakpoint
CREATE INDEX `idx_jobs_workmode` ON `job_postings` (`work_mode`);--> statement-breakpoint
CREATE INDEX `idx_jobs_salary` ON `job_postings` (`salary_max`);--> statement-breakpoint
CREATE INDEX `idx_jobs_posted` ON `job_postings` (`posted_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_active` ON `job_postings` (`is_active`);--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_start` text NOT NULL,
	`generated_at` text DEFAULT (datetime('now')) NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `snapshots_week_start_unique` ON `snapshots` (`week_start`);