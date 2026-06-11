export interface NormalizedRegion {
  city: string | null
  country: string | null
  region: string | null
}

const COUNTRY_ALIASES: Record<string, string> = {
  'united states': 'US',
  'united states of america': 'US',
  usa: 'US',
  us: 'US',
  canada: 'CA',
  ca: 'CA',
  'united kingdom': 'GB',
  uk: 'GB',
  gb: 'GB',
  germany: 'DE',
  de: 'DE',
  france: 'FR',
  fr: 'FR',
  australia: 'AU',
  au: 'AU'
}

export function normalizeRegion(
  locationText: string | null,
  adzunaArea?: string[]
): NormalizedRegion {
  if (adzunaArea?.length) {
    const [country, region, city] = adzunaArea
    return {
      country: COUNTRY_ALIASES[country?.toLowerCase()] ?? country ?? null,
      region: region ?? null,
      city: city ?? null
    }
  }

  if (!locationText) return { country: null, region: null, city: null }

  const lower = locationText.toLowerCase()
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (lower.includes(alias)) {
      return { country: code, region: null, city: null }
    }
  }

  return { country: null, region: null, city: locationText.trim() || null }
}
