import { desc } from 'drizzle-orm'

import { useDb } from '../../db'
import { snapshots } from '../../db/schema'

export default defineCachedEventHandler(
  async () => {
    const db = useDb()
    const row = await db
      .select()
      .from(snapshots)
      .orderBy(desc(snapshots.weekStart))
      .limit(1)
      .then((r) => r[0] ?? null)

    if (!row) {
      throw createError({ statusCode: 404, message: 'No snapshot available yet' })
    }

    return {
      weekStart: row.weekStart,
      generatedAt: row.generatedAt,
      ...JSON.parse(row.payload)
    }
  },
  { maxAge: 86400 }
)
