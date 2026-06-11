import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

export function useDb() {
  const config = useRuntimeConfig()
  const client = createClient({
    url: config.tursoUrl,
    authToken: config.tursoAuthToken
  })
  return drizzle(client, { schema })
}
