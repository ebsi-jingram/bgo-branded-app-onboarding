import type { Result } from '../types/onboarding'

export interface Prerequisite<Id extends string, Answers> {
  id: Id
  /** Omitted = always applies. */
  when?: (answers: Answers) => boolean
}

/** The minimum the ordering needs from a step. */
export interface StepNode<Id extends string, Answers> {
  id: Id
  appliesWhen: (answers: Answers) => boolean
  prerequisites: readonly Prerequisite<Id, Answers>[]
}

export interface OrderedStep<Id extends string, Step> {
  step: Step
  /** 1-based position in the dependency-ordered list. */
  order: number
  /** Direct prerequisites that apply to these answers. */
  prerequisites: readonly Id[]
}

export type OrderError<Id extends string> =
  | { kind: 'duplicate-id'; id: Id }
  | { kind: 'unknown-prerequisite'; step: Id; missing: string }
  | { kind: 'cycle'; path: readonly Id[] }

/** Duplicate IDs and prerequisites pointing at IDs that don't exist. Independent of answers. */
export function validateSteps<Id extends string, Answers>(steps: readonly StepNode<Id, Answers>[]): OrderError<Id>[] {
  const errors: OrderError<Id>[] = []
  const ids = new Set<string>()
  for (const step of steps) {
    if (ids.has(step.id)) errors.push({ kind: 'duplicate-id', id: step.id })
    ids.add(step.id)
  }
  for (const step of steps) {
    for (const prerequisite of step.prerequisites) {
      if (!ids.has(prerequisite.id)) errors.push({ kind: 'unknown-prerequisite', step: step.id, missing: prerequisite.id })
    }
  }
  return errors
}

/**
 * Keeps the steps that apply to these answers and puts every step after its
 * prerequisites. Ties keep registry order, so the output is stable.
 *
 * Prerequisites that don't apply (condition false, or the step itself
 * doesn't apply) are dropped, so each step lists every prerequisite it needs.
 */
export function orderSteps<Id extends string, Answers, Step extends StepNode<Id, Answers>>(
  steps: readonly Step[],
  answers: Answers,
): Result<OrderedStep<Id, Step>[], OrderError<Id>[]> {
  const registryErrors = validateSteps<Id, Answers>(steps)
  if (registryErrors.length > 0) return { ok: false, error: registryErrors }

  const applicable = steps.filter((s) => s.appliesWhen(answers))
  const position = new Map<string, number>(applicable.map((s, i) => [s.id, i]))
  const edges = new Map<Id, Id[]>(
    applicable.map((s) => [
      s.id,
      s.prerequisites
        .filter((pre) => position.has(pre.id) && (pre.when?.(answers) ?? true))
        .map((pre) => pre.id)
        .sort((a, b) => (position.get(a) ?? 0) - (position.get(b) ?? 0)),
    ]),
  )

  const cycle = findCycle(applicable.map((s) => s.id), edges)
  if (cycle !== null) return { ok: false, error: [{ kind: 'cycle', path: cycle }] }

  return {
    ok: true,
    value: topologicalOrder(applicable, edges, position).map((step, i) => ({
      step,
      order: i + 1,
      prerequisites: edges.get(step.id) ?? [],
    })),
  }
}

/** Kahn's algorithm; among ready steps, the earliest in the registry goes first. */
function topologicalOrder<Id extends string, Step extends { id: Id }>(
  applicable: readonly Step[],
  edges: ReadonlyMap<Id, readonly Id[]>,
  position: ReadonlyMap<string, number>,
): Step[] {
  const remaining = new Map<Id, number>(applicable.map((s) => [s.id, edges.get(s.id)?.length ?? 0]))
  const dependents = new Map<Id, Id[]>()
  for (const [id, prerequisites] of edges) {
    for (const pre of prerequisites) dependents.set(pre, [...(dependents.get(pre) ?? []), id])
  }
  const byId = new Map<Id, Step>(applicable.map((s) => [s.id, s]))
  const ready = applicable.filter((s) => remaining.get(s.id) === 0)
  const sorted: Step[] = []

  while (ready.length > 0) {
    ready.sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))
    const next = ready.shift()
    if (next === undefined) break
    sorted.push(next)
    for (const dependent of dependents.get(next.id) ?? []) {
      const count = (remaining.get(dependent) ?? 0) - 1
      remaining.set(dependent, count)
      const step = byId.get(dependent)
      if (count === 0 && step !== undefined) ready.push(step)
    }
  }
  return sorted
}

/** Depth-first search. Returns the IDs on the first cycle found (first ID repeated at the end), or null. */
function findCycle<Id extends string>(ids: readonly Id[], edges: ReadonlyMap<Id, readonly Id[]>): Id[] | null {
  const state = new Map<Id, 'visiting' | 'done'>()
  const stack: Id[] = []

  const visit = (id: Id): Id[] | null => {
    const current = state.get(id)
    if (current === 'done') return null
    if (current === 'visiting') return [...stack.slice(stack.indexOf(id)), id]
    state.set(id, 'visiting')
    stack.push(id)
    for (const pre of edges.get(id) ?? []) {
      const cycle = visit(pre)
      if (cycle !== null) return cycle
    }
    stack.pop()
    state.set(id, 'done')
    return null
  }

  for (const id of ids) {
    const cycle = visit(id)
    if (cycle !== null) return cycle
  }
  return null
}
