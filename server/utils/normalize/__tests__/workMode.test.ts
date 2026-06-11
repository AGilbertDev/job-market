import { describe, expect, it } from 'vitest'

import { normalizeWorkMode } from '../workMode'

describe('normalizeWorkMode', () => {
  it.each([
    ['Remote position, work from anywhere', 'remote'],
    ['Fully remote role', 'remote'],
    ['WFH available', 'remote'],
    ['Hybrid — 3 days in office', 'hybrid'],
    ['Onsite position, Toronto', 'onsite'],
    ['On-site required', 'onsite'],
    ['No location info', 'unknown']
  ] as const)('maps "%s" to %s', (text, expected) => {
    expect(normalizeWorkMode(text)).toBe(expected)
  })
})
