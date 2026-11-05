import { describe, expect, it } from 'vitest'
import { DEMO_SCENARIOS } from '../data/demoScenarios'
import { checklistForDraft } from '../data/testSupport'
import { describeReason, phaseRuns } from './labels'

describe('phaseRuns', () => {
  it('keeps every task in its original order', () => {
    const tasks = checklistForDraft(DEMO_SCENARIOS[2]!.answers)
    expect(phaseRuns(tasks).flatMap((run) => run.tasks)).toEqual(tasks)
  })

  it('shows the access phase again when Scenario C invites after the client creates the Play app', () => {
    const phases = phaseRuns(checklistForDraft(DEMO_SCENARIOS[2]!.answers)).map((run) => run.phase)
    expect(phases.indexOf('03')).toBeLessThan(phases.indexOf('04'))
    expect(phases.lastIndexOf('03')).toBeGreaterThan(phases.indexOf('04'))
  })
})

describe('describeReason', () => {
  it('explains each kind of block in plain words', () => {
    expect(describeReason({ kind: 'open-question', id: 'Q17' })).toBe(
      'Pending decision Q17: no agreed process for clients who give Empyrean no access',
    )
    expect(describeReason({ kind: 'needs-answer', field: 'appleAccess' })).toBe(
      'Needs an answer: which Apple access model to use',
    )
    expect(describeReason({ kind: 'client-blocker', category: 'duns-number' })).toBe(
      'Client reported: No D-U-N-S number yet',
    )
    expect(describeReason({ kind: 'upstream', id: 'apple-enrollment' })).toBe(
      'Waiting on a blocked step: Enroll in the Apple Developer Program',
    )
  })
})
