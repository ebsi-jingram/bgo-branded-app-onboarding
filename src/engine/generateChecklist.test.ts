import { describe, expect, it } from 'vitest'
import type { OnboardingAnswers, Procedure } from '../types/onboarding'
import { generateChecklist, validateRegistry } from './generateChecklist'

const answers: OnboardingAnswers = {
  organizationName: 'Test Org (fictional)',
  apple: { accountStatus: 'active', access: 'admin' },
  google: null,
  clientContactConfirmed: 'yes',
  registration: null,
  securityRestrictions: 'no',
  knownBlockers: [],
}

type P = Procedure<string>

const task = (id: string, overrides: Partial<P> = {}): P => ({
  id,
  playbookStep: '00.00',
  title: id,
  summary: '',
  audience: 'internal',
  phase: '01',
  platform: 'shared',
  owners: ['tbc'],
  sources: [{ tag: 'P', note: 'test' }],
  approval: 'not-approved',
  appliesWhen: () => true,
  prerequisites: [],
  inputs: [],
  outputs: [],
  completionCriteria: '',
  ...overrides,
})

const after = (...ids: string[]) => ids.map((id) => ({ id }))

const ok = (procedures: readonly P[], a: OnboardingAnswers = answers) => {
  const result = generateChecklist(procedures, a)
  if (!result.ok) throw new Error(JSON.stringify(result.error))
  return result.value.tasks
}

describe('validateRegistry', () => {
  it('reports duplicate IDs', () => {
    expect(validateRegistry([task('a'), task('a')])).toEqual([{ kind: 'duplicate-id', id: 'a' }])
  })

  it('reports prerequisites that point at missing tasks', () => {
    expect(validateRegistry([task('a', { prerequisites: after('ghost') })])).toEqual([
      { kind: 'unknown-prerequisite', task: 'a', missing: 'ghost' },
    ])
  })
})

describe('generateChecklist', () => {
  it('refuses to generate from an invalid registry', () => {
    const result = generateChecklist([task('a', { prerequisites: after('ghost') })], answers)
    expect(result.ok).toBe(false)
  })

  it('reports a cycle with the path that forms it', () => {
    const result = generateChecklist(
      [task('a', { prerequisites: after('c') }), task('b', { prerequisites: after('a') }), task('c', { prerequisites: after('b') })],
      answers,
    )
    expect(result).toEqual({ ok: false, error: [{ kind: 'cycle', path: ['a', 'c', 'b', 'a'] }] })
  })

  it('ignores a cycle whose edges never apply together', () => {
    const tasks = ok([
      task('a', { prerequisites: [{ id: 'b', when: () => false }] }),
      task('b', { prerequisites: after('a') }),
    ])
    expect(tasks.map((t) => t.procedure.id)).toEqual(['a', 'b'])
  })

  it('puts prerequisites first and otherwise keeps registry order', () => {
    const tasks = ok([task('late', { prerequisites: after('early') }), task('other'), task('early')])
    expect(tasks.map((t) => t.procedure.id)).toEqual(['other', 'early', 'late'])
    expect(tasks.map((t) => t.order)).toEqual([1, 2, 3])
  })

  it('assigns waves so independent tasks can run in parallel', () => {
    const tasks = ok([task('a'), task('b'), task('c', { prerequisites: after('a', 'b') }), task('d', { prerequisites: after('a') })])
    expect(Object.fromEntries(tasks.map((t) => [t.procedure.id, t.wave]))).toEqual({ a: 1, b: 1, c: 2, d: 2 })
  })

  it('leaves out tasks that do not apply and drops edges to them', () => {
    const tasks = ok([task('skip', { appliesWhen: () => false }), task('keep', { prerequisites: after('skip') })])
    expect(tasks.map((t) => [t.procedure.id, t.prerequisites])).toEqual([['keep', []]])
  })

  it('drops conditional prerequisites whose condition is false', () => {
    const tasks = ok([task('a'), task('b', { prerequisites: [{ id: 'a', when: (x) => x.google !== null }] })])
    expect(tasks.find((t) => t.procedure.id === 'b')?.prerequisites).toEqual([])
  })

  it('blocks a task with its own blocker and everything downstream of it', () => {
    const tasks = ok([
      task('a', { blockers: () => [{ kind: 'open-question', id: 'Q17' }] }),
      task('b', { prerequisites: after('a') }),
      task('c', { prerequisites: after('b') }),
      task('free'),
    ])
    expect(Object.fromEntries(tasks.map((t) => [t.procedure.id, t.state]))).toEqual({
      a: { kind: 'blocked', reasons: [{ kind: 'open-question', id: 'Q17' }] },
      b: { kind: 'blocked', reasons: [{ kind: 'upstream', id: 'a' }] },
      c: { kind: 'blocked', reasons: [{ kind: 'upstream', id: 'b' }] },
      free: { kind: 'planned' },
    })
  })

  it('resolves owners that depend on the answers', () => {
    const tasks = ok([task('a', { owners: (x) => (x.apple?.access === 'admin' ? ['engineering'] : ['client']) })])
    expect(tasks[0]?.owners).toEqual(['engineering'])
  })
})
