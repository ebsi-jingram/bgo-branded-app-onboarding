import { describe, expect, it } from 'vitest'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import type { DraftAnswers, Screen } from '../types/onboarding'
import { type Action, reduce, stepErrors, visibleSteps } from './flow'

const run = (screen: Screen, ...actions: Action[]) => actions.reduce(reduce, screen)
const complete: DraftAnswers = DEMO_SCENARIOS[0]!.answers

describe('visibleSteps', () => {
  it('shows only the store steps for the selected platforms', () => {
    expect(visibleSteps({ platforms: ['ios'] })).toEqual(['organization', 'platforms', 'apple', 'contacts', 'restrictions'])
    expect(visibleSteps({ platforms: ['android'] })).toEqual(['organization', 'platforms', 'google', 'contacts', 'restrictions'])
    expect(visibleSteps({})).toEqual(['organization', 'platforms', 'contacts', 'restrictions'])
  })
})

describe('stepErrors', () => {
  it('asks for registration contacts only when an account must be created', () => {
    const base = { ...complete, platforms: ['ios' as const], clientContactConfirmed: 'yes' as const }
    expect(stepErrors('contacts', base)).toEqual([])
    expect(stepErrors('contacts', { ...base, appleAccountStatus: 'none' }).map((e) => e.field)).toEqual([
      'registrationContactsReady',
    ])
  })

  it("ignores other steps' missing answers", () => {
    expect(stepErrors('organization', { organizationName: 'Acme (fictional)' })).toEqual([])
  })
})

describe('reduce', () => {
  it('starts at the first question with no answers', () => {
    expect(run({ kind: 'welcome' }, { type: 'start' })).toEqual({
      kind: 'question',
      step: 'organization',
      draft: {},
      showErrors: false,
    })
  })

  it('stays on a step and shows errors until it is answered', () => {
    const screen = run({ kind: 'welcome' }, { type: 'start' }, { type: 'continue' })
    expect(screen).toMatchObject({ kind: 'question', step: 'organization', showErrors: true })
    expect(run(screen, { type: 'update', patch: { organizationName: 'Acme (fictional)' } }, { type: 'continue' })).toMatchObject({
      step: 'platforms',
      showErrors: false,
    })
  })

  it('skips the Google step for iOS-only and reaches results', () => {
    const screen = run(
      { kind: 'question', step: 'platforms', draft: { ...complete, platforms: ['ios'] }, showErrors: false },
      { type: 'continue' },
      { type: 'continue' },
    )
    expect(screen).toMatchObject({ kind: 'question', step: 'contacts' })
    const results = run(screen, { type: 'continue' }, { type: 'continue' })
    expect(results.kind).toBe('results')
    expect(results.kind === 'results' && results.answers.google).toBe(null)
  })

  it('goes back through visible steps, then to the welcome screen', () => {
    const start: Screen = { kind: 'question', step: 'contacts', draft: { ...complete, platforms: ['android'] }, showErrors: false }
    expect(run(start, { type: 'back' })).toMatchObject({ step: 'google' })
    expect(run(start, { type: 'back' }, { type: 'back' }, { type: 'back' }, { type: 'back' })).toEqual({ kind: 'welcome' })
  })

  it('returns from results to the last step with answers kept', () => {
    const results = run({ kind: 'question', step: 'restrictions', draft: complete, showErrors: false }, { type: 'continue' })
    expect(results.kind).toBe('results')
    expect(run(results, { type: 'back' })).toEqual({ kind: 'question', step: 'restrictions', draft: complete, showErrors: false })
  })

  it('restarts from anywhere', () => {
    expect(run({ kind: 'question', step: 'apple', draft: complete, showErrors: true }, { type: 'restart' })).toEqual({ kind: 'welcome' })
  })

  it('ignores actions that make no sense for the current screen', () => {
    const welcome: Screen = { kind: 'welcome' }
    expect(run(welcome, { type: 'continue' }, { type: 'back' })).toBe(welcome)
  })
})
