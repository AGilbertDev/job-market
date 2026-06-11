import { count, eq } from 'drizzle-orm'

import { useDb } from '../db'
import { jobPostings } from '../db/schema'

export default defineCachedEventHandler(
  async () => {
    const db = useDb()
    const active = eq(jobPostings.isActive, 1)

    const [roles, seniorities, countries, workModes] = await Promise.all([
      db
        .select({ value: jobPostings.role, count: count() })
        .from(jobPostings)
        .where(active)
        .groupBy(jobPostings.role),
      db
        .select({ value: jobPostings.seniority, count: count() })
        .from(jobPostings)
        .where(active)
        .groupBy(jobPostings.seniority),
      db
        .select({ value: jobPostings.country, count: count() })
        .from(jobPostings)
        .where(active)
        .groupBy(jobPostings.country),
      db
        .select({ value: jobPostings.workMode, count: count() })
        .from(jobPostings)
        .where(active)
        .groupBy(jobPostings.workMode)
    ])

    return { roles, seniorities, countries, workModes }
  },
  { maxAge: 86400 }
)
