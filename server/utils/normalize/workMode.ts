export type WorkMode = 'remote' | 'hybrid' | 'onsite' | 'unknown'

export function normalizeWorkMode(text: string): WorkMode {
  const t = text.toLowerCase()
  if (/\bhybrid\b/.test(t)) return 'hybrid'
  if (/\bremote\b|\bfully[- ]?remote\b|\bwork[- ]?from[- ]?home\b|\bwfh\b/.test(t)) return 'remote'
  if (/\bonsite\b|\bon[- ]?site\b|\bin[- ]?office\b|\bin[- ]?person\b/.test(t)) return 'onsite'
  return 'unknown'
}
