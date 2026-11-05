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
  clientContactConfirmed: 'yes',
  securityRestrictions: 'no',
  knownBlockers: [],
}

describe('normalize', () => {
  it('accepts complete answers for both platforms', () => {
    const result = normalize(complete)
    expect(result).toEqual({
      ok: true,
      value: {
        organizationName: 'Example Health Co',
        apple: { accountStatus: 'active', access: 'admin' },
        google: { accountStatus: 'active', access: 'account-admin' },
        clientContactConfirmed: 'yes',
        registration: null,
        securityRestrictions: 'no',
        knownBlockers: [],
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
    const result = normalize({
      ...complete,
      platforms: ['android'],
      appleAccountStatus: undefined,
      appleAccess: undefined,
    })
    expect(result.ok).toBe(true)
  })

  it('requires at least one platform', () => {
    const result = normalize({ ...complete, platforms: [] })
    expect(result).toEqual({ ok: false, error: [expect.objectContaining({ field: 'platforms' })] })
  })

  it('rejects a blank organization name', () => {
    const result = normalize({ ...complete, organizationName: '   ' })
    expect(result).toEqual({ ok: false, error: [expect.objectContaining({ field: 'organizationName' })] })
  })

  it('requires registration contacts when an account must be created', () => {
    const result = normalize({ ...complete, googleAccountStatus: 'none' })
    expect(result).toEqual({
      ok: false,
      error: [expect.objectContaining({ field: 'registrationContactsReady' })],
    })
    const fixed = normalize({ ...complete, googleAccountStatus: 'none', registrationContactsReady: 'unsure' })
    expect(fixed.ok && fixed.value.registration).toEqual({ contactsReady: 'unsure' })
  })

  it('ignores registration contacts for a platform that is no longer selected', () => {
    const result = normalize({
      ...complete,
      platforms: ['ios'],
      googleAccountStatus: 'none',
      registrationContactsReady: 'yes',
    })
    expect(result.ok && result.value.registration).toBe(null)
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
      'clientContactConfirmed',
      'securityRestrictions',
      'knownBlockers',
    ])
  })

  it('removes duplicate platforms and blockers', () => {
    const result = normalize({
      ...complete,
      platforms: ['ios', 'ios'],
      knownBlockers: ['duns-number', 'duns-number'],
    })
    expect(result.ok && result.value.knownBlockers).toEqual(['duns-number'])
    expect(result.ok && result.value.google).toBe(null)
  })
})
