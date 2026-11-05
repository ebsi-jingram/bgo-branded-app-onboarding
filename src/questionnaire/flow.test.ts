import { describe, expect, it } from 'vitest'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import type { DraftAnswers } from '../types/onboarding'
import { type Action, type AppState, initialState, reduce, stepErrors, visibleSteps } from './flow'

const run = (state: AppState, ...actions: Action[]) => actions.reduce(reduce, state)
const at = (screen: AppState['screen'], done: AppState['done'] = []): AppState => ({ screen, done })
const complete: DraftAnswers = DEMO_SCENARIOS[0]!.answers

describe('visibleSteps', () => {
  it('shows only the store steps for the selected platforms', () => {
    expect(visibleSteps({ platforms: ['ios'] })).toEqual(['organization', 'platforms', 'apple', 'security'])
    expect(visibleSteps({ platforms: ['android'] })).toEqual(['organization', 'platforms', 'google', 'security'])
    expect(visibleSteps({})).toEqual(['organization', 'platforms', 'security'])
  })
})

describe('stepErrors', () => {
  it("ignores other steps' missing answers", () => {
    expect(stepErrors('organization', { organizationName: 'Acme (fictional)' })).toEqual([])
  })
})

describe('reduce', () => {
  it('starts at the first question with no answers', () => {
    expect(run(initialState, { type: 'start' }).screen).toEqual({
      kind: 'question',
      step: 'organization',
      draft: {},
      showErrors: false,
    })
  })

  it('stays on a step and shows errors until it is answered', () => {
    const state = run(initialState, { type: 'start' }, { type: 'continue' })
    expect(state.screen).toMatchObject({ kind: 'question', step: 'organization', showErrors: true })
    expect(run(state, { type: 'update', patch: { organizationName: 'Acme (fictional)' } }, { type: 'continue' }).screen).toMatchObject({
      step: 'platforms',
      showErrors: false,
    })
  })

  it('skips the Google step for iOS only and reaches the checklist', () => {
    const state = run(
      at({ kind: 'question', step: 'platforms', draft: { ...complete, platforms: ['ios'] }, showErrors: false }),
      { type: 'continue' },
      { type: 'continue' },
    )
    expect(state.screen).toMatchObject({ kind: 'question', step: 'security' })
    const checklist = run(state, { type: 'continue' }).screen
    expect(checklist.kind).toBe('checklist')
    expect(checklist.kind === 'checklist' && checklist.answers.google).toBe(null)
  })

  it('goes back through visible steps, then to the welcome screen', () => {
    const start = at({ kind: 'question', step: 'security', draft: { ...complete, platforms: ['android'] }, showErrors: false })
    expect(run(start, { type: 'back' }).screen).toMatchObject({ step: 'google' })
    expect(run(start, { type: 'back' }, { type: 'back' }, { type: 'back' }, { type: 'back' }).screen).toEqual({ kind: 'welcome' })
  })

  it('keeps progress when the client changes an answer that does not affect it', () => {
    const checklist = run(initialState, { type: 'load', draft: complete })
    const ticked = run(checklist, { type: 'toggle-step', id: 'invite-apple-admin' })
    expect(ticked.done).toEqual(['invite-apple-admin'])
    const edited = run(ticked, { type: 'back' }, { type: 'update', patch: { securityReview: 'no' } }, { type: 'continue' })
    expect(edited.screen.kind).toBe('checklist')
    expect(edited.done).toEqual(['invite-apple-admin'])
  })

  it('un-ticks a step when a new answer adds a step that must come first', () => {
    const ticked = run(initialState, { type: 'load', draft: complete }, { type: 'toggle-step', id: 'invite-apple-admin' })
    const edited = run(ticked, { type: 'back' }, { type: 'update', patch: { securityReview: 'yes' } }, { type: 'continue' })
    expect(edited.done).toEqual([])
  })

  it('loads every demo scenario straight into the checklist', () => {
    for (const scenario of DEMO_SCENARIOS) {
      expect(run(initialState, { type: 'load', draft: scenario.answers }).screen.kind, scenario.id).toBe('checklist')
    }
  })

  it('sends an incomplete loaded draft to its first unanswered step', () => {
    expect(run(initialState, { type: 'load', draft: { organizationName: 'Acme (fictional)' } }).screen).toMatchObject({
      kind: 'question',
      step: 'platforms',
      showErrors: true,
    })
  })

  it('restarts from anywhere and clears progress', () => {
    const ticked = run(initialState, { type: 'load', draft: complete }, { type: 'toggle-step', id: 'invite-apple-admin' })
    expect(run(ticked, { type: 'restart' })).toEqual(initialState)
  })

  it('ignores actions that make no sense for the current screen', () => {
    expect(run(initialState, { type: 'continue' }, { type: 'back' }, { type: 'toggle-step', id: 'enroll-apple' })).toBe(initialState)
  })
})
