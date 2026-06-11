export type NormalizedRole =
  | 'Frontend'
  | 'Backend'
  | 'Full-Stack'
  | 'DevOps/SRE'
  | 'Data'
  | 'Mobile'
  | 'ML/AI'
  | 'QA'
  | 'EM'
  | 'unknown'

const RULES: [RegExp, NormalizedRole][] = [
  [/\bml\b|\bmachine[- ]?learning\b|\bartificial[- ]intelligence\b|\bai[/ ]ml\b/i, 'ML/AI'],
  [/\bdata\s+(engineer|analyst|scientist|architect)\b/i, 'Data'],
  [/\bdevops\b|\bsre\b|\bsite[- ]?reliability\b|\bplatform[- ]?engineer\b/i, 'DevOps/SRE'],
  [/\bengineering[- ]?manager\b|\bem\b.*\bengineer/i, 'EM'],
  [/\bmobile\b|\bios\b|\bandroid\b|\bflutter\b|\breact[- ]?native\b/i, 'Mobile'],
  [/\bquality[- ]?assurance\b|\bqa\b|\btest[- ]?engineer\b|\bsdet\b/i, 'QA'],
  [/\bfront[- ]?end\b|\bui[/ ]ux\b|\bvue\b|\breact\b|\bangular\b/i, 'Frontend'],
  [/\bback[- ]?end\b|\bapi\b|\bnode(\.?js)?\b|\bruby\b|\bphp\b|\bjava\b|\bpython\b/i, 'Backend'],
  [/\bfull[- ]?stack\b/i, 'Full-Stack']
]

export function normalizeRole(title: string): NormalizedRole {
  for (const [pattern, role] of RULES) {
    if (pattern.test(title)) return role
  }
  return 'unknown'
}
