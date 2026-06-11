import { describe, expect, it } from 'vitest'

import { normalizeRole } from '../role'

describe('normalizeRole', () => {
  it.each([
    ['Senior Frontend Developer', 'Frontend'],
    ['React Engineer', 'Frontend'],
    ['Vue.js Developer', 'Frontend'],
    ['Backend Engineer - Node.js', 'Backend'],
    ['Python Developer', 'Backend'],
    ['Full-Stack Engineer', 'Full-Stack'],
    ['Fullstack Developer', 'Full-Stack'],
    ['DevOps Engineer', 'DevOps/SRE'],
    ['Site Reliability Engineer', 'DevOps/SRE'],
    ['Platform Engineer', 'DevOps/SRE'],
    ['Data Engineer', 'Data'],
    ['Data Analyst', 'Data'],
    ['Machine Learning Engineer', 'ML/AI'],
    ['AI/ML Researcher', 'ML/AI'],
    ['iOS Developer', 'Mobile'],
    ['Android Engineer', 'Mobile'],
    ['React Native Developer', 'Mobile'],
    ['QA Engineer', 'QA'],
    ['Test Engineer', 'QA'],
    ['Engineering Manager', 'EM'],
    ['Random Posting', 'unknown']
  ] as const)('maps "%s" to %s', (title, expected) => {
    expect(normalizeRole(title)).toBe(expected)
  })
})
