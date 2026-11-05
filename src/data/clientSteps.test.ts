import { describe, expect, it } from 'vitest'
import { checklistFor } from '../checklist/progress'
import { validateSteps } from '../engine/orderSteps'
import type { AccountStatus, AppleAccess, GoogleAccess, OnboardingAnswers, Tri } from '../types/onboarding'
import { CLIENT_STEP_IDS, CLIENT_STEPS, type ClientStepId } from './clientSteps'
import { DEMO_SCENARIOS } from './demoScenarios'
import { normalize } from '../domain/normalize'

const idsFor = (answers: OnboardingAnswers) => checklistFor(answers).map((s) => s.step.id)
const before = (ids: ClientStepId[], first: ClientStepId, second: ClientStepId) => ids.indexOf(first) < ids.indexOf(second)

const base: OnboardingAnswers = {
  organizationName: 'Test Org (fictional)',
  apple: { accountStatus: 'active', access: 'admin' },
  google: { accountStatus: 'active', access: 'account-admin' },
  securityReview: 'no',
}

describe('client step registry', () => {
  it('has exactly one step per declared ID and is valid', () => {
    expect(CLIENT_STEPS.map((s) => s.id).sort()).toEqual([...CLIENT_STEP_IDS].sort())
    expect(validateSteps(CLIENT_STEPS)).toEqual([])
  })

  it('never shows internal names or open-question numbers to clients', () => {
    // "Connect" is our internal product; "App Store Connect" is Apple's and is fine.
    const internal = /\b(Carlos|Balazs|(?<!App Store )Connect|Jira|Asana|SecretSpec|SOPS|CT Test|Usher|Bridge|Q\d\d)\b/
    for (const s of CLIENT_STEPS) {
      const text = [s.title, s.why, s.who, ...s.instructions, s.important ?? '', ...(s.links ?? []).map((l) => l.label)].join(' ')
      expect(text, s.id).not.toMatch(internal)
    }
  })

  it('links only to official Apple and Google pages over HTTPS', () => {
    const allowed = /^https:\/\/(developer\.apple\.com|appstoreconnect\.apple\.com|play\.google\.com)\//
    for (const link of CLIENT_STEPS.flatMap((s) => s.links ?? [])) expect(link.url).toMatch(allowed)
  })
})

describe('checklists for different answers', () => {
  it('existing accounts with Admin: just invite, then tell the representative', () => {
    expect(idsFor(base)).toEqual(['invite-apple-admin', 'invite-google-account-admin', 'notify-representative'])
  })

  it('new Apple account: gather details, enroll, then invite', () => {
    const ids = idsFor({ ...base, apple: { accountStatus: 'none', access: 'admin' }, google: null })
    expect(ids).toEqual(['prepare-registration', 'enroll-apple', 'invite-apple-admin', 'notify-representative'])
  })

  it('App Manager: the client creates and sends both Apple keys', () => {
    const ids = idsFor({ ...base, apple: { accountStatus: 'active', access: 'app-manager' } })
    expect(ids).toEqual(expect.arrayContaining(['enable-apple-api-access', 'create-apple-api-key', 'create-apns-key', 'send-apple-keys']))
    expect(before(ids, 'enable-apple-api-access', 'create-apple-api-key')).toBe(true)
    expect(before(ids, 'create-apns-key', 'send-apple-keys')).toBe(true)
    expect(idsFor(base)).not.toContain('create-apple-api-key')
  })

  it('Google app-level access: create the app before inviting Empyrean', () => {
    const ids = idsFor({ ...base, google: { accountStatus: 'none', access: 'app-admin' } })
    expect(before(ids, 'register-google', 'create-google-app')).toBe(true)
    expect(before(ids, 'create-google-app', 'invite-google-app-admin')).toBe(true)
  })

  it('security review comes before any invitation', () => {
    const ids = idsFor({ ...base, securityReview: 'unsure' })
    expect(before(ids, 'security-review', 'invite-apple-admin')).toBe(true)
    expect(before(ids, 'security-review', 'invite-google-account-admin')).toBe(true)
  })

  it('"not sure" about an account: check first, no invitation yet', () => {
    const ids = idsFor({ ...base, apple: { accountStatus: 'unsure', access: 'admin' } })
    expect(ids).toContain('check-apple-account')
    expect(ids).not.toContain('invite-apple-admin')
    expect(ids).toContain('invite-google-account-admin')
  })

  it('"need to check with my team" about access: talk to the representative, no invitation yet', () => {
    const ids = idsFor({ ...base, google: { accountStatus: 'none', access: 'needs-discussion' } })
    expect(ids).toEqual(expect.arrayContaining(['discuss-google-access', 'register-google']))
    expect(ids.filter((id) => id.startsWith('invite-google'))).toEqual([])
  })

  it('every demo scenario produces a checklist', () => {
    for (const scenario of DEMO_SCENARIOS) {
      const answers = normalize(scenario.answers)
      expect(answers.ok, scenario.id).toBe(true)
      if (answers.ok) expect(idsFor(answers.value).length).toBeGreaterThan(1)
    }
  })
})

// ---------------------------------------------------------------------------
// Every combination of answers
// ---------------------------------------------------------------------------

const STATUSES: AccountStatus[] = ['active', 'pending-verification', 'none', 'unsure']
const APPLE: AppleAccess[] = ['admin', 'app-manager', 'needs-discussion']
const GOOGLE: GoogleAccess[] = ['account-admin', 'app-admin', 'needs-discussion']
const TRI: Tri[] = ['yes', 'no', 'unsure']

function* allAnswers(): Generator<OnboardingAnswers> {
  const apples = STATUSES.flatMap((accountStatus) => APPLE.map((access) => ({ accountStatus, access })))
  const googles = STATUSES.flatMap((accountStatus) => GOOGLE.map((access) => ({ accountStatus, access })))
  const selections = [
    ...apples.map((apple) => ({ apple, google: null })),
    ...googles.map((google) => ({ apple: null, google })),
    ...apples.flatMap((apple) => googles.map((google) => ({ apple, google }))),
  ]
  for (const selection of selections)
    for (const securityReview of TRI)
      yield { ...selection, organizationName: 'Exhaustive (fictional)', securityReview } as OnboardingAnswers
}

describe('every combination of answers', () => {
  it('produces a sensible checklist', () => {
    const violations: string[] = []
    let combinations = 0
    for (const answers of allAnswers()) {
      combinations++
      const steps = checklistFor(answers)
      const ids = steps.map((s) => s.step.id)
      const fail = (message: string) => violations.push(`${message} | ${JSON.stringify(answers)}`)

      if (ids[ids.length - 1] !== 'notify-representative') fail('notify-representative is not last')
      for (const s of steps) {
        if (s.step.platform === 'ios' && answers.apple === null) fail(`${s.step.id} is iOS-only`)
        if (s.step.platform === 'android' && answers.google === null) fail(`${s.step.id} is Android-only`)
        for (const pre of s.prerequisites) if (!before(ids, pre, s.step.id)) fail(`${pre} not before ${s.step.id}`)
      }
      // At most one way of inviting Empyrean per store.
      if (ids.filter((id) => id.startsWith('invite-apple')).length > 1) fail('two Apple invitations')
      if (ids.filter((id) => id.startsWith('invite-google')).length > 1) fail('two Google invitations')
      // Every selected store either has an invitation or a reason there isn't one yet.
      if (answers.apple && !ids.some((id) => id.startsWith('invite-apple') || id === 'check-apple-account' || id === 'discuss-apple-access'))
        fail('Apple has no invitation and no reason')
      if (answers.google && !ids.some((id) => id.startsWith('invite-google') || id === 'check-google-account' || id === 'discuss-google-access'))
        fail('Google has no invitation and no reason')
    }
    expect(violations.slice(0, 20)).toEqual([])
    // (12 Apple + 12 Google + 144 both) × 3 security answers.
    expect(combinations).toBe(504)
  })
})
