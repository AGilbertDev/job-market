import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const jobPostings = sqliteTable(
  'job_postings',
  {
    id: text('id').primaryKey(),
    source: text('source').notNull(),
    sourceId: text('source_id').notNull(),
    sourceUrl: text('source_url').notNull(),

    title: text('title').notNull(),
    role: text('role'),
    seniority: text('seniority'),
    company: text('company'),

    country: text('country'),
    region: text('region'),
    city: text('city'),
    workMode: text('work_mode'),

    salaryMin: real('salary_min'),
    salaryMax: real('salary_max'),
    salaryCurrency: text('salary_currency'),
    salaryPeriod: text('salary_period').default('year'),
    salaryIsEstimated: integer('salary_is_estimated').default(0),

    tags: text('tags'),
    descriptionExcerpt: text('description_excerpt'),

    postedAt: text('posted_at'),
    ingestedAt: text('ingested_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    lastSeenAt: text('last_seen_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    isActive: integer('is_active').notNull().default(1)
  },
  (t) => [
    index('idx_jobs_role').on(t.role),
    index('idx_jobs_seniority').on(t.seniority),
    index('idx_jobs_country').on(t.country),
    index('idx_jobs_region').on(t.region),
    index('idx_jobs_workmode').on(t.workMode),
    index('idx_jobs_salary').on(t.salaryMax),
    index('idx_jobs_posted').on(t.postedAt),
    index('idx_jobs_active').on(t.isActive)
  ]
)

export const snapshots = sqliteTable('snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weekStart: text('week_start').notNull().unique(),
  generatedAt: text('generated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  payload: text('payload').notNull()
})

export type JobPosting = typeof jobPostings.$inferSelect
export type NewJobPosting = typeof jobPostings.$inferInsert
export type Snapshot = typeof snapshots.$inferSelect
export type NewSnapshot = typeof snapshots.$inferInsert
