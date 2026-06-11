import { describe, expect, it } from 'vitest'

import { extractTags } from '../tags'

describe('extractTags', () => {
  it('extracts known skills from a job description', () => {
    const tags = extractTags(
      'We use React and TypeScript on the frontend, Node.js on the backend, deployed on AWS with Docker and Kubernetes.'
    )
    expect(tags).toContain('react')
    expect(tags).toContain('typescript')
    expect(tags).toContain('node.js')
    expect(tags).toContain('aws')
    expect(tags).toContain('docker')
    expect(tags).toContain('kubernetes')
  })

  it('returns an empty array when no known skills are mentioned', () => {
    expect(extractTags('A lovely job with no tech listed')).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(extractTags('We use PYTHON and GO')).toContain('python')
    expect(extractTags('We use PYTHON and GO')).toContain('go')
  })
})
