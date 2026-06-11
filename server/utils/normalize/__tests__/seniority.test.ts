import { describe, expect, it } from 'vitest'

import { normalizeSeniority } from '../seniority'

describe('normalizeSeniority', () => {
  it.each([
    ['Software Engineering Intern', '', 'intern'],
    ['Junior Developer', '', 'junior'],
    ['Jr. Software Engineer', '', 'junior'],
    ['Senior Engineer', '', 'senior'],
    ['Sr. Developer', '', 'senior'],
    ['Staff Software Engineer', '', 'staff'],
    ['Principal Engineer', '', 'principal'],
    ['Lead Developer', '', 'lead'],
    ['Software Engineer II', '', 'mid'],
    ['Software Engineer', '', 'unknown']
  ] as const)('maps "%s" to %s', (title, desc, expected) => {
    expect(normalizeSeniority(title, desc)).toBe(expected)
  })
})
