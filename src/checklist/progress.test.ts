import { describe, expect, it } from 'vitest'
import type { OnboardingAnswers } from '../types/onboarding'
import { checklistFor, keepConsistent, progressOf, statusOf, toggleStep } from './progress'
import { loadSaved, save } from './storage'

const newAppleAccount: OnboardingAnswers = {
  organizationName: 'Cedar Valley Schools (fictional)',
  apple: { accountStatus: 'none', access: 'admin' },
  google: null,
  securityReview: 'no',
}
const steps = checklistFor(newAppleAccount)
const ids = steps.map((s) => s.step.id)

describe('checklist progress', () => {
  it('starts with only steps that have no prerequisites ready', () => {
    expect(ids).toEqual(['prepare-registration', 'enroll-apple', 'invite-apple-admin', 'notify-representative'])
    expect(steps.map((s) => statusOf(s, new Set()))).toEqual(['ready', 'locked', 'locked', 'locked'])
  })

  it('unlocks the next step when one is marked done', () => {
    const done = toggleStep(steps, [], 'prepare-registration')
    expect(done).toEqual(['prepare-registration'])
    expect(statusOf(steps[1]!, new Set(done))).toBe('ready')
  })

  it('does not let a locked step be marked done', () => {
    expect(toggleStep(steps, [], 'invite-apple-admin')).toEqual([])
  })

  it('un-marks everything that depends on a step when it is un-marked', () => {
    const all = ids.reduce<typeof ids>((done, id) => toggleStep(steps, done, id), [])
    expect(all).toEqual(ids)
    expect(toggleStep(steps, all, 'enroll-apple')).toEqual(['prepare-registration'])
  })

  it('reports progress and the next step', () => {
    const done = new Set(toggleStep(steps, [], 'prepare-registration'))
    expect(progressOf(steps, done)).toMatchObject({ done: 1, total: 4, percent: 25 })
    expect(progressOf(steps, done).next?.step.id).toBe('enroll-apple')
  })

  it('keeps finished steps consistent when answers change', () => {
    const done = ['prepare-registration', 'enroll-apple', 'invite-apple-admin'] as const
    // A security review now has to happen before the invitation.
    const withReview = checklistFor({ ...newAppleAccount, securityReview: 'yes' })
    expect(keepConsistent(withReview, [...done])).toEqual(['prepare-registration', 'enroll-apple'])
    // Switching to iOS + Android keeps Apple progress.
    const both = checklistFor({ ...newAppleAccount, google: { accountStatus: 'active', access: 'account-admin' } })
    expect(keepConsistent(both, [...done])).toEqual([...done])
  })
})

describe('storage', () => {
  const memory = () => {
    const items = new Map<string, string>()
    return {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => void items.set(k, v),
      removeItem: (k: string) => void items.delete(k),
    }
  }

  it('round-trips answers and finished steps', () => {
    const storage = memory()
    save(storage, { draft: { organizationName: 'Acme (fictional)', platforms: ['ios'] }, done: ['prepare-registration'] })
    expect(loadSaved(storage)).toEqual({
      draft: { organizationName: 'Acme (fictional)', platforms: ['ios'] },
      done: ['prepare-registration'],
    })
    save(storage, null)
    expect(loadSaved(storage)).toBe(null)
  })

  it('drops values it does not recognise', () => {
    const storage = memory()
    storage.setItem(
      'bgo-branded-app-setup-v1',
      JSON.stringify({ draft: { platforms: ['ios', 'windows'], appleAccess: 'owner' }, done: ['ghost', 'enroll-apple'] }),
    )
    expect(loadSaved(storage)).toEqual({ draft: { platforms: ['ios'] }, done: ['enroll-apple'] })
  })

  it('survives broken data and unavailable storage', () => {
    expect(loadSaved({ getItem: () => '{not json' })).toBe(null)
    expect(
      loadSaved({
        getItem: () => {
          throw new Error('blocked')
        },
      }),
    ).toBe(null)
    expect(() =>
      save(
        {
          setItem: () => {
            throw new Error('blocked')
          },
          removeItem: () => {},
        },
        { draft: {}, done: [] },
      ),
    ).not.toThrow()
  })
})
