export interface SalaryStats {
  max: number | null
  median: number | null
  min: number | null
  p25: number | null
  p75: number | null
}

export interface FacetCount {
  count: number
  salaryStats: SalaryStats
  value: string | null
}

export interface SnapshotPayload {
  aiMentionShare: number
  hybridShare: number
  onsiteShare: number
  remoteShare: number
  salaryByRegion: Record<string, SalaryStats>
  salaryByRole: Record<string, SalaryStats>
  salaryBySeniority: Record<string, SalaryStats>
  salaryByWorkMode: Record<string, SalaryStats>
  salaryOverall: SalaryStats
  topStacks: { tag: string; count: number }[]
  totalActivePostings: number
}
