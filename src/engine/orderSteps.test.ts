import { describe, expect, it } from 'vitest'
import { orderSteps, type StepNode, validateSteps } from './orderSteps'

type Answers = { flag: boolean }
type Node = StepNode<string, Answers>

const step = (id: string, overrides: Partial<Node> = {}): Node => ({
  id,
  appliesWhen: () => true,
  prerequisites: [],
  ...overrides,
})
const after = (...ids: string[]) => ids.map((id) => ({ id }))
const answers: Answers = { flag: false }

const ok = (steps: readonly Node[], a: Answers = answers) => {
  const result = orderSteps(steps, a)
  if (!result.ok) throw new Error(JSON.stringify(result.error))
  return result.value
}

describe('validateSteps', () => {
  it('reports duplicate IDs', () => {
    expect(validateSteps([step('a'), step('a')])).toEqual([{ kind: 'duplicate-id', id: 'a' }])
  })

  it('reports prerequisites that point at missing steps', () => {
    expect(validateSteps([step('a', { prerequisites: after('ghost') })])).toEqual([
      { kind: 'unknown-prerequisite', step: 'a', missing: 'ghost' },
    ])
  })
})

describe('orderSteps', () => {
  it('refuses to order an invalid registry', () => {
    expect(orderSteps([step('a', { prerequisites: after('ghost') })], answers).ok).toBe(false)
  })

  it('reports a cycle with the path that forms it', () => {
    const result = orderSteps(
      [step('a', { prerequisites: after('c') }), step('b', { prerequisites: after('a') }), step('c', { prerequisites: after('b') })],
      answers,
    )
    expect(result).toEqual({ ok: false, error: [{ kind: 'cycle', path: ['a', 'c', 'b', 'a'] }] })
  })

  it('ignores a cycle whose edges never apply together', () => {
    const steps = ok([step('a', { prerequisites: [{ id: 'b', when: (x) => x.flag }] }), step('b', { prerequisites: after('a') })])
    expect(steps.map((s) => s.step.id)).toEqual(['a', 'b'])
  })

  it('puts prerequisites first and otherwise keeps registry order', () => {
    const steps = ok([step('late', { prerequisites: after('early') }), step('other'), step('early')])
    expect(steps.map((s) => s.step.id)).toEqual(['other', 'early', 'late'])
    expect(steps.map((s) => s.order)).toEqual([1, 2, 3])
  })

  it('leaves out steps that do not apply and drops edges to them', () => {
    const steps = ok([step('skip', { appliesWhen: () => false }), step('keep', { prerequisites: after('skip') })])
    expect(steps.map((s) => [s.step.id, s.prerequisites])).toEqual([['keep', []]])
  })

  it('drops conditional prerequisites whose condition is false', () => {
    const steps = ok([step('a'), step('b', { prerequisites: [{ id: 'a', when: (x) => x.flag }] })])
    expect(steps.find((s) => s.step.id === 'b')?.prerequisites).toEqual([])
    const withFlag = ok([step('a'), step('b', { prerequisites: [{ id: 'a', when: (x) => x.flag }] })], { flag: true })
    expect(withFlag.find((s) => s.step.id === 'b')?.prerequisites).toEqual(['a'])
  })
})
