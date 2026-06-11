import { describe, expect, it } from 'vitest'

import { parseSalaryString } from '../salary'

describe('parseSalaryString', () => {
  it('parses an annual USD range', () => {
    const r = parseSalaryString('$80,000 - $120,000', 'USD')
    expect(r.min).toBe(80000)
    expect(r.max).toBe(120000)
    expect(r.currency).toBe('USD')
    expect(r.period).toBe('year')
  })

  it('parses a Remotive-style range string', () => {
    const r = parseSalaryString('$40,000 - $50,000')
    expect(r.min).toBe(40000)
    expect(r.max).toBe(50000)
    expect(r.period).toBe('year')
  })

  it('detects hourly pay and annualizes it', () => {
    const r = parseSalaryString('$50/hr')
    expect(r.period).toBe('hour')
    expect(r.min).toBeCloseTo(50 * 2080)
  })

  it('detects monthly pay and annualizes it', () => {
    const r = parseSalaryString('€5,000/month', 'EUR')
    expect(r.period).toBe('month')
    expect(r.min).toBe(5000 * 12)
    expect(r.currency).toBe('EUR')
  })

  it('returns nulls for empty string', () => {
    const r = parseSalaryString('')
    expect(r.min).toBeNull()
    expect(r.max).toBeNull()
  })
})
