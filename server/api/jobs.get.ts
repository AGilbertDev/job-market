import { and, asc, count, desc, eq, gte, inArray, like, lte } from 'drizzle-orm'
import { z } from 'zod'

import { useDb } from '../db'
import { jobPostings } from '../db/schema'

const SORTABLE_COLUMNS = {
  salary_max: jobPostings.salaryMax,
  posted_at: jobPostings.postedAt,
  company: jobPostings.company,
  title: jobPostings.title
} as const

const querySchema = z.object({
  role: z.array(z.string()).optional(),
  seniority: z.array(z.string()).optional(),
  country: z.array(z.string()).optional(),
  region: z.array(z.string()).optional(),
  work_mode: z.array(z.string()).optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  posted_within: z.coerce.number().optional(),
  q: z.string().optional(),
  sort: z.enum(['salary_max', 'posted_at', 'company', 'title']).default('posted_at'),
  dir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25)
})

export default defineCachedEventHandler(
  async (event) => {
    const raw = getQuery(event)
    const parsed = querySchema.safeParse(raw)
    if (!parsed.success) {
      throw createError({ statusCode: 400, message: 'Invalid query parameters' })
    }
    const q = parsed.data
    const db = useDb()

    const conditions = [eq(jobPostings.isActive, 1)]

    if (q.role?.length) conditions.push(inArray(jobPostings.role, q.role))
    if (q.seniority?.length) conditions.push(inArray(jobPostings.seniority, q.seniority))
    if (q.country?.length) conditions.push(inArray(jobPostings.country, q.country))
    if (q.region?.length) conditions.push(inArray(jobPostings.region, q.region))
    if (q.work_mode?.length) conditions.push(inArray(jobPostings.workMode, q.work_mode))
    if (q.salary_min != null) conditions.push(gte(jobPostings.salaryMin, q.salary_min))
    if (q.salary_max != null) conditions.push(lte(jobPostings.salaryMax, q.salary_max))
    if (q.q) conditions.push(like(jobPostings.title, `%${q.q}%`))

    if (q.posted_within) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - q.posted_within)
      conditions.push(gte(jobPostings.postedAt, cutoff.toISOString().slice(0, 10)))
    }

    const where = and(...conditions)
    const orderCol = SORTABLE_COLUMNS[q.sort]
    const order = q.dir === 'asc' ? asc(orderCol) : desc(orderCol)
    const offset = (q.page - 1) * q.pageSize

    const [rows, [{ total }]] = await Promise.all([
      db.select().from(jobPostings).where(where).orderBy(order).limit(q.pageSize).offset(offset),
      db.select({ total: count() }).from(jobPostings).where(where)
    ])

    return { rows, total, page: q.page, pageSize: q.pageSize }
  },
  { maxAge: 300, getKey: (event) => `jobs:${JSON.stringify(getQuery(event))}` }
)
