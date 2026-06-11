export type Seniority =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'staff'
  | 'principal'
  | 'unknown'

const RULES: [RegExp, Seniority][] = [
  [/\bintern\b|\bstage\b|\bstagiaire\b/i, 'intern'],
  [/\bprincipal\b/i, 'principal'],
  [/\bstaff\b/i, 'staff'],
  [/\blead\b/i, 'lead'],
  [/\bsenior\b|\bsr\.?\b/i, 'senior'],
  [/\bjunior\b|\bjr\.?\b/i, 'junior'],
  [/\bmid[- ]?level\b|\bii\b|\biii\b/i, 'mid']
]

export function normalizeSeniority(title: string, description = ''): Seniority {
  const text = `${title} ${description}`
  for (const [pattern, level] of RULES) {
    if (pattern.test(text)) return level
  }
  return 'unknown'
}
