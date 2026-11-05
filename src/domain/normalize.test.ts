import { describe, expect, it } from 'vitest'
import type { DraftAnswers } from '../types/onboarding'
import { normalize } from './normalize'

const complete: DraftAnswers = {
  organizationName: '  Example Health Co  ',
  platforms: ['ios', 'android'],
  appleAccountStatus: 'active',
  appleAccess: 'admin',
  googleAccountStatus: 'active',
  googleAccess: 'account-admin',
  securityReview: 'no',
}

describe('normalize', () => {
  it('accepts complete answers for both platforms', () => {
    expect(normalize(complete)).toEqual({
      ok: true,
      value: {
        organizationName: 'Example Health Co',
        apple: { accountStatus: 'active', access: 'admin' },
        google: { accountStatus: 'active', access: 'account-admin' },
        securityReview: 'no',
      },
    })
  })

  it('drops stale Google answers when only iOS is selected', () => {
    const result = normalize({ ...complete, platforms: ['ios'] })
    expect(result.ok && result.value.google).toBe(null)
    expect(result.ok && result.value.apple).toEqual({ accountStatus: 'active', access: 'admin' })
  })

  it('drops stale Apple answers when only Android is selected', () => {
    const result = normalize({ ...complete, platforms: ['android'] })
    expect(result.ok && result.value.apple).toBe(null)
  })

  it('does not require answers for a platform that is not selected', () => {
    expect(normalize({ ...complete, platforms: ['android'], appleAccountStatus: undefined, appleAccess: undefined }).ok).toBe(true)
  })

  it('requires at least one platform', () => {
    expect(normalize({ ...complete, platforms: [] })).toEqual({
      ok: false,
      error: [expect.objectContaining({ field: 'platforms' })],
    })
  })

  it('rejects a blank organization name', () => {
    expect(normalize({ ...complete, organizationName: '   ' })).toEqual({
      ok: false,
      error: [expect.objectContaining({ field: 'organizationName' })],
    })
  })

  it('reports every missing answer at once', () => {
    const result = normalize({ platforms: ['ios', 'android'] })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.map((e) => e.field)).toEqual([
      'organizationName',
      'appleAccountStatus',
      'appleAccess',
      'googleAccountStatus',
      'googleAccess',
      'securityReview',
    ])
  })

  it('removes duplicate platforms', () => {
    const result = normalize({ ...complete, platforms: ['ios', 'ios'] })
    expect(result.ok && result.value.google).toBe(null)
  })
})
