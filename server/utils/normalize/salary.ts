export type SalaryPeriod = 'year' | 'month' | 'day' | 'hour'

export interface NormalizedSalary {
  currency: string | null
  isEstimated: boolean
  max: number | null
  min: number | null
  period: SalaryPeriod
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  CA$: 'CAD',
  AU$: 'AUD'
}

const PERIOD_MULTIPLIERS: Record<SalaryPeriod, number> = {
  year: 1,
  month: 12,
  day: 260,
  hour: 2080
}

function guessPeriod(value: number): SalaryPeriod {
  if (value < 200) return 'hour'
  if (value < 2000) return 'day'
  if (value < 20000) return 'month'
  return 'year'
}

function inferCurrency(text: string, sourceCurrency?: string): string {
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(symbol)) return code
  }
  return sourceCurrency ?? 'USD'
}

export function parseSalaryString(text: string, sourceCurrency?: string): NormalizedSalary {
  const clean = text.replace(/,/g, '').trim()
  const numbers = [...clean.matchAll(/[\d.]+/g)].map((m) => parseFloat(m[0]))
  if (!numbers.length)
    return { min: null, max: null, currency: null, period: 'year', isEstimated: false }

  const [raw1, raw2] = numbers
  const period = guessPeriod(raw1)
  const multiplier = PERIOD_MULTIPLIERS[period]
  const min = raw1 * multiplier
  const max = raw2 != null ? raw2 * multiplier : raw1 * multiplier

  return {
    min,
    max,
    currency: inferCurrency(clean, sourceCurrency),
    period,
    isEstimated: false
  }
}

export function normalizeSalary(
  min: number | null,
  max: number | null,
  period: SalaryPeriod,
  currency: string | null,
  isEstimated = false
): NormalizedSalary {
  const multiplier = PERIOD_MULTIPLIERS[period]
  return {
    min: min != null ? min * multiplier : null,
    max: max != null ? max * multiplier : null,
    currency,
    period,
    isEstimated
  }
}
