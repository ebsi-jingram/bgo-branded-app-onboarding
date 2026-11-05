import { describe, expect, it } from 'vitest'
import type { DraftAnswers } from '../types/onboarding'
import { DEMO_SCENARIOS } from './demoScenarios'
import { allPrerequisites, checklistForDraft, find, idsOf, isBefore } from './testSupport'

function scenario(id: 'A' | 'B' | 'C' | 'D'): DraftAnswers {
  const found = DEMO_SCENARIOS.find((s) => s.id === id)
  if (found === undefined) throw new Error(`No scenario ${id}`)
  return found.answers
}

const A = scenario('A')
const B = scenario('B')
const C = scenario('C')
const D = scenario('D')

describe('Scenario A: existing accounts, Admin access', () => {
  const tasks = checklistForDraft(A)

  it('skips registration (handoff case 1)', () => {
    expect(idsOf(tasks)).not.toContain('apple-enrollment')
    expect(idsOf(tasks)).not.toContain('google-registration')
    expect(idsOf(tasks)).not.toContain('identify-enrollment-contacts')
  })

  it('invites, verifies, then configures, tests and submits', () => {
    expect(isBefore(tasks, 'apple-invitation', 'verify-apple-access')).toBe(true)
    expect(isBefore(tasks, 'verify-apple-access', 'register-ios-bundle-id')).toBe(true)
    expect(isBefore(tasks, 'register-ios-bundle-id', 'create-ios-app-record')).toBe(true)
    expect(isBefore(tasks, 'validate-configuration', 'ios-branded-build')).toBe(true)
    expect(isBefore(tasks, 'ios-branded-qa', 'ios-submit')).toBe(true)
  })

  it('has Empyrean create the API key under Admin, after the Account Holder enables API access', () => {
    expect(find(tasks, 'create-asc-api-key').owners).toEqual(['engineering'])
    expect(find(tasks, 'enable-asc-api-access').owners).toEqual(['client-account-holder'])
  })

  it('blocks only the iOS unlisted-distribution path, which has no agreed procedure', () => {
    const blocked = tasks.filter((t) => t.state.kind === 'blocked')
    expect(find(tasks, 'apple-unlisted-distribution').state).toEqual({
      kind: 'blocked',
      reasons: [{ kind: 'open-question', id: 'Q15' }],
    })
    expect(idsOf(blocked).sort()).toEqual(
      ['apple-agreement-acceptance', 'apple-unlisted-distribution', 'future-releases', 'ios-launch-verify'].sort(),
    )
  })
})

describe('Scenario B: new Apple account, iOS only', () => {
  const tasks = checklistForDraft(B)

  it('enrolls before any access step (handoff case 2)', () => {
    expect(isBefore(tasks, 'apple-enrollment', 'send-apple-permission-instructions')).toBe(true)
    expect(isBefore(tasks, 'apple-enrollment', 'apple-invitation')).toBe(true)
    expect(allPrerequisites(tasks, 'apple-enrollment')).toContain('prepare-enrollment-info')
  })

  it('has no Android or Google Play tasks (handoff case 5)', () => {
    expect(tasks.filter((t) => t.procedure.platform === 'android')).toEqual([])
  })
})

describe('Scenario C: mixed account status, limited access', () => {
  const tasks = checklistForDraft(C)

  it('registers Google only (handoff case 3)', () => {
    expect(idsOf(tasks)).toContain('google-registration')
    expect(idsOf(tasks)).not.toContain('apple-enrollment')
  })

  it('keeps Apple access independent of Google registration', () => {
    expect(allPrerequisites(tasks, 'verify-apple-access')).not.toContain('google-registration')
  })

  it('has the client create the Play app before inviting Empyrean (handoff case 6)', () => {
    expect(find(tasks, 'create-play-app-record').owners).toEqual(['client'])
    expect(find(tasks, 'google-invitation').prerequisites).toContain('create-play-app-record')
    expect(isBefore(tasks, 'approve-android-identifiers', 'create-play-app-record')).toBe(true)
  })

  it('has the client create both Apple keys under App Manager', () => {
    expect(find(tasks, 'create-asc-api-key').owners).toEqual(['client'])
    expect(find(tasks, 'create-apns-key').owners).toEqual(['client'])
  })

  it('waits for the security review before either invitation', () => {
    expect(find(tasks, 'apple-invitation').prerequisites).toContain('client-security-review')
    expect(find(tasks, 'google-invitation').prerequisites).toContain('client-security-review')
  })
})

describe('Scenario D: no Empyrean access', () => {
  const tasks = checklistForDraft(D)

  it('requires an exception, blocked on the undefined process (handoff case 7)', () => {
    for (const id of ['apple-no-access-exception', 'google-no-access-exception'] as const) {
      expect(find(tasks, id).state).toEqual({ kind: 'blocked', reasons: [{ kind: 'open-question', id: 'Q17' }] })
    }
  })

  it('never invites or verifies access', () => {
    for (const id of ['apple-invitation', 'google-invitation', 'verify-apple-access', 'verify-google-access'] as const) {
      expect(idsOf(tasks)).not.toContain(id)
    }
  })

  it('shows client-managed submission as blocked, not approved', () => {
    expect(find(tasks, 'ios-submit').owners).toEqual(['client'])
    expect(find(tasks, 'ios-submit').state.kind).toBe('blocked')
    expect(find(tasks, 'android-submit').state.kind).toBe('blocked')
  })
})

describe('other branches', () => {
  it('excludes Apple tasks for Android only (handoff case 4)', () => {
    const tasks = checklistForDraft({ ...C, platforms: ['android'] })
    expect(tasks.filter((t) => t.procedure.platform === 'ios')).toEqual([])
  })

  it('adds a check for unknown account status and blocks the invitation (handoff case 8)', () => {
    const tasks = checklistForDraft({ ...A, appleAccountStatus: 'unsure' })
    expect(idsOf(tasks)).toContain('confirm-apple-account-status')
    expect(find(tasks, 'apple-invitation').state).toEqual({
      kind: 'blocked',
      reasons: [{ kind: 'needs-answer', field: 'appleAccountStatus' }],
    })
  })

  it('adds a decision task for undecided access and leaves owners open (handoff case 9)', () => {
    const tasks = checklistForDraft({ ...A, appleAccess: 'undecided' })
    expect(idsOf(tasks)).toContain('decide-apple-access')
    expect(find(tasks, 'send-apple-permission-instructions').state).toEqual({
      kind: 'blocked',
      reasons: [{ kind: 'needs-answer', field: 'appleAccess' }],
    })
    expect(find(tasks, 'register-ios-bundle-id').owners).toEqual(['tbc'])
  })

  it('lists prerequisites before dependents in every scenario (handoff case 10)', () => {
    for (const { answers } of DEMO_SCENARIOS) {
      const tasks = checklistForDraft(answers)
      for (const t of tasks) for (const pre of t.prerequisites) expect(isBefore(tasks, pre, t.procedure.id)).toBe(true)
    }
  })

  it('blocks the whole plan until a primary contact is confirmed', () => {
    const tasks = checklistForDraft({ ...A, clientContactConfirmed: 'unsure' })
    expect(find(tasks, 'start-implementation').state).toEqual({
      kind: 'blocked',
      reasons: [{ kind: 'needs-answer', field: 'clientContactConfirmed' }],
    })
    expect(tasks.every((t) => t.state.kind === 'blocked')).toBe(true)
  })

  it('blocks invitations while it is unknown whether a security review is needed', () => {
    const tasks = checklistForDraft({ ...A, securityRestrictions: 'unsure' })
    expect(find(tasks, 'client-security-review').state.kind).toBe('blocked')
    expect(find(tasks, 'apple-invitation').state.kind).toBe('blocked')
    expect(find(tasks, 'request-branding').state.kind).toBe('planned')
  })

  it('blocks enrollment on a reported D-U-N-S problem', () => {
    const tasks = checklistForDraft({ ...B, knownBlockers: ['duns-number'] })
    expect(find(tasks, 'apple-enrollment').state).toEqual({
      kind: 'blocked',
      reasons: [{ kind: 'client-blocker', category: 'duns-number' }],
    })
  })
})

describe('changing an answer', () => {
  it('updates the plan', () => {
    const before = checklistForDraft(A)
    const after = checklistForDraft({ ...A, appleAccountStatus: 'none', registrationContactsReady: 'yes' })
    expect(idsOf(before)).not.toContain('apple-enrollment')
    expect(idsOf(after)).toContain('apple-enrollment')
    expect(isBefore(after, 'apple-enrollment', 'apple-invitation')).toBe(true)

    const iosOnly = checklistForDraft({ ...A, platforms: ['ios'] })
    expect(iosOnly.filter((t) => t.procedure.platform === 'android')).toEqual([])
    expect(iosOnly.length).toBeLessThan(before.length)
  })
})
